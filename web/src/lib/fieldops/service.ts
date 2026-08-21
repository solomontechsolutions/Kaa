/**
 * The FieldOps workflow.
 *
 * Every transition a submission can make lives here, and each one is guarded
 * by the role of whoever asked for it and by the status the submission is
 * actually in. The UIs — the handset app, the FieldOps portal, Kaa's review
 * queue — hold no rules of their own; they call these and render what comes
 * back.
 *
 * Two things this module refuses, and both matter:
 *
 *  • A field officer cannot approve. FieldOps collects, Kaa accepts. If the
 *    collector could accept their own work, the verification Kaa sells to
 *    tenants would be a self-certification.
 *  • Nothing skips review. There is no transition from a device status
 *    straight to APPROVED.
 */

import { randomUUID } from "node:crypto";

import { ForbiddenError, assertCan, canTouch, type Actor } from "./permissions";
import * as store from "./store";
import type {
  AuditAction,
  AuditEvent,
  CollectedProperty,
  CorrectionRequest,
  PropertySubmission,
  SubmissionPhoto,
  SubmissionStatus,
} from "./types";

export class WorkflowError extends Error {
  readonly status = 409;
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

const now = () => new Date().toISOString();

function record(
  submission: PropertySubmission,
  actor: Actor,
  action: AuditAction,
  detail: string,
): AuditEvent {
  const event: AuditEvent = {
    id: randomUUID(),
    submissionId: submission.id,
    at: now(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    detail,
  };
  submission.history = [...submission.history, event];
  return event;
}

/** Legal moves. Anything not listed here is refused rather than tolerated. */
const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  DRAFT: ["DRAFT", "READY_FOR_UPLOAD"],
  READY_FOR_UPLOAD: ["DRAFT", "UPLOADING"],
  UPLOADING: ["UPLOADED", "READY_FOR_UPLOAD"],
  // An operator can decide straight from the queue without opening the record
  // first. Requiring the open step would only add a line to the audit trail
  // claiming someone read it, which is worse than not having the line.
  UPLOADED: ["UNDER_REVIEW", "APPROVED", "CORRECTION_REQUIRED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "CORRECTION_REQUIRED", "REJECTED"],
  CORRECTION_REQUIRED: ["CORRECTION_REQUIRED", "RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW", "APPROVED", "CORRECTION_REQUIRED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

function assertTransition(from: SubmissionStatus, to: SubmissionStatus) {
  if (!TRANSITIONS[from].includes(to)) {
    throw new WorkflowError(`A submission cannot go from ${from} to ${to}.`);
  }
}

function load(actor: Actor, id: string): PropertySubmission {
  const submission = store.getSubmission(id);
  if (!submission) throw new WorkflowError("No such submission.");
  if (!canTouch(actor, submission)) throw new ForbiddenError();
  return submission;
}

// ── Collection, on the handset ─────────────────────────────────────────

export function createDraft(actor: Actor, property: Partial<CollectedProperty> = {}): PropertySubmission {
  assertCan(actor, "collect");

  const submission: PropertySubmission = {
    id: randomUUID(),
    reference: store.nextReference(),
    status: "DRAFT",
    officerId: actor.id,
    officerName: actor.name,
    property: { amenities: [], ...property },
    photos: [],
    createdAt: now(),
    updatedAt: now(),
    submissionCount: 0,
    corrections: [],
    history: [],
  };

  record(submission, actor, "created", `${actor.name} started ${submission.reference}`);
  return store.putSubmission(submission);
}

export function updateDraft(
  actor: Actor,
  id: string,
  patch: Partial<CollectedProperty>,
): PropertySubmission {
  assertCan(actor, "collect");
  const submission = load(actor, id);

  // A submission Kaa has accepted is Kaa's record. An officer editing it after
  // the fact would change what was approved without anyone reviewing it.
  if (submission.status === "APPROVED" || submission.status === "REJECTED") {
    throw new WorkflowError("A closed submission cannot be edited.");
  }
  if (submission.status === "UNDER_REVIEW" || submission.status === "UPLOADED") {
    throw new WorkflowError("This submission is with Kaa. Wait for the review to come back.");
  }

  const changed = Object.keys(patch).filter(
    (key) => JSON.stringify((patch as Record<string, unknown>)[key]) !==
      JSON.stringify((submission.property as unknown as Record<string, unknown>)[key]),
  );

  submission.property = { ...submission.property, ...patch };
  submission.updatedAt = now();

  if (changed.length) {
    record(submission, actor, "edited", `${actor.name} updated ${changed.join(", ")}`);
  }
  return store.putSubmission(submission);
}

export function addPhoto(actor: Actor, id: string, photo: Omit<SubmissionPhoto, "id">): PropertySubmission {
  assertCan(actor, "collect");
  const submission = load(actor, id);

  submission.photos = [...submission.photos, { ...photo, id: randomUUID() }];
  submission.updatedAt = now();
  record(submission, actor, "photo_added", `${actor.name} added a ${photo.room.replace(/_/g, " ")} photo`);
  return store.putSubmission(submission);
}

export function removePhoto(actor: Actor, id: string, photoId: string): PropertySubmission {
  assertCan(actor, "collect");
  const submission = load(actor, id);

  submission.photos = submission.photos.filter((photo) => photo.id !== photoId);
  submission.updatedAt = now();
  record(submission, actor, "photo_removed", `${actor.name} removed a photo`);
  return store.putSubmission(submission);
}

export function captureGps(
  actor: Actor,
  id: string,
  fix: { latitude: number; longitude: number; accuracyM: number },
): PropertySubmission {
  assertCan(actor, "collect");
  const submission = load(actor, id);

  submission.property = {
    ...submission.property,
    latitude: fix.latitude,
    longitude: fix.longitude,
    gpsAccuracyM: fix.accuracyM,
    gpsCapturedAt: now(),
  };
  submission.updatedAt = now();
  record(submission, actor, "gps_captured", `${actor.name} captured a fix to ±${Math.round(fix.accuracyM)} m`);
  return store.putSubmission(submission);
}

// ── What "finished" means ──────────────────────────────────────────────

export interface Readiness {
  ready: boolean;
  /** Human-readable, in the order an officer should fix them. */
  missing: string[];
}

/** The minimum Kaa can review. Anything thinner wastes a reviewer's time. */
export function readiness(submission: PropertySubmission): Readiness {
  const p = submission.property;
  const missing: string[] = [];

  if (!p.propertyKind) missing.push("Property type");
  if (p.bedrooms === undefined) missing.push("Bedrooms");
  if (p.bathrooms === undefined) missing.push("Bathrooms");
  if (!p.monthlyRent) missing.push("Monthly rent");
  if (!p.ward) missing.push("Ward");
  if (p.latitude === undefined || p.longitude === undefined) missing.push("GPS location");
  // A fix worse than 50 m does not identify a building on a Dar street.
  else if ((p.gpsAccuracyM ?? Infinity) > 50) missing.push("A GPS fix better than 50 m");
  if (!p.landlordName || !p.landlordPhone) missing.push("Landlord name and phone");
  if (!p.landlordConsent) missing.push("Landlord consent to enrol");
  if (!submission.photos.some((photo) => photo.room === "exterior")) missing.push("An exterior photo");
  if (submission.photos.length < 3) missing.push("At least three photos");

  return { ready: missing.length === 0, missing };
}

export function markReady(actor: Actor, id: string): PropertySubmission {
  assertCan(actor, "upload");
  const submission = load(actor, id);
  assertTransition(submission.status, "READY_FOR_UPLOAD");

  const check = readiness(submission);
  if (!check.ready) {
    throw new WorkflowError(`Still needed: ${check.missing.join(", ")}.`);
  }

  submission.status = "READY_FOR_UPLOAD";
  submission.updatedAt = now();
  record(submission, actor, "marked_ready", `${actor.name} marked ${submission.reference} ready to upload`);
  return store.putSubmission(submission);
}

// ── Upload, and the review loop ────────────────────────────────────────

/**
 * Send it to Kaa.
 *
 * Handles both the first upload and a re-upload answering a correction, since
 * from the officer's side it is the same button and the same act. What differs
 * is which status it lands in, and that Kaa can tell the two apart in the
 * queue.
 */
export function upload(actor: Actor, id: string): PropertySubmission {
  const submission = load(actor, id);
  const answering = submission.status === "CORRECTION_REQUIRED";

  assertCan(actor, answering ? "resubmit" : "upload");

  if (!answering && submission.status !== "READY_FOR_UPLOAD" && submission.status !== "UPLOADING") {
    throw new WorkflowError("Review the submission and mark it ready first.");
  }

  const check = readiness(submission);
  if (!check.ready) throw new WorkflowError(`Still needed: ${check.missing.join(", ")}.`);

  submission.submissionCount += 1;
  submission.uploadedAt = now();
  submission.updatedAt = now();

  if (answering) {
    submission.status = "RESUBMITTED";
    // Close the open correction; the reviewer sees it was answered, and by what.
    submission.corrections = submission.corrections.map((correction) =>
      correction.resolvedAt ? correction : { ...correction, resolvedAt: now() },
    );
    record(
      submission,
      actor,
      "resubmitted",
      `${actor.name} resubmitted ${submission.reference} (attempt ${submission.submissionCount})`,
    );
  } else {
    submission.status = "UPLOADED";
    record(submission, actor, "uploaded", `${actor.name} uploaded ${submission.reference}`);
  }

  return store.putSubmission(submission);
}

/** A Kaa operator opening the record. Recorded, so "nobody looked" is checkable. */
export function openForReview(actor: Actor, id: string): PropertySubmission {
  assertCan(actor, "review");
  const submission = load(actor, id);

  if (submission.status === "UPLOADED" || submission.status === "RESUBMITTED") {
    assertTransition(submission.status, "UNDER_REVIEW");
    submission.status = "UNDER_REVIEW";
    submission.updatedAt = now();
    record(submission, actor, "opened_for_review", `${actor.name} opened ${submission.reference} for review`);
    store.putSubmission(submission);
  }
  return submission;
}

export function requestCorrection(
  actor: Actor,
  id: string,
  input: { message: string; fields?: string[] },
): PropertySubmission {
  assertCan(actor, "request_correction");
  const submission = load(actor, id);

  const message = input.message.trim();
  // An operator who sends work back without saying why has cost an officer a
  // trip across Dar and told them nothing.
  if (message.length < 10) {
    throw new WorkflowError("Say what needs correcting — the officer sees this and nothing else.");
  }

  assertTransition(submission.status, "CORRECTION_REQUIRED");

  const correction: CorrectionRequest = {
    id: randomUUID(),
    submissionId: submission.id,
    raisedBy: actor.id,
    raisedByName: actor.name,
    raisedAt: now(),
    message,
    fields: input.fields ?? [],
  };

  submission.corrections = [...submission.corrections, correction];
  submission.status = "CORRECTION_REQUIRED";
  submission.updatedAt = now();
  submission.reviewedAt = now();
  submission.reviewedBy = actor.id;
  submission.reviewedByName = actor.name;

  record(submission, actor, "correction_requested", `${actor.name} requested a correction: ${message}`);
  return store.putSubmission(submission);
}

export interface ApprovalResult {
  submission: PropertySubmission;
  /** The Kaa unit id this became. FieldOps' record crossing into Kaa's. */
  kaaUnitId: string;
}

/**
 * Accept it into Kaa.
 *
 * This is the only door between the two entities. Everything before it is
 * FieldOps' working data; everything after is a Kaa property a tenant can be
 * shown.
 */
export function approve(actor: Actor, id: string): ApprovalResult {
  assertCan(actor, "approve");
  const submission = load(actor, id);
  assertTransition(submission.status, "APPROVED");

  const kaaUnitId = `unit-${submission.reference.toLowerCase()}`;

  submission.status = "APPROVED";
  submission.kaaUnitId = kaaUnitId;
  submission.reviewedAt = now();
  submission.reviewedBy = actor.id;
  submission.reviewedByName = actor.name;
  submission.updatedAt = now();

  record(submission, actor, "approved", `${actor.name} approved ${submission.reference} into Kaa as ${kaaUnitId}`);
  store.putSubmission(submission);

  return { submission, kaaUnitId };
}

export function reject(actor: Actor, id: string, reason: string): PropertySubmission {
  assertCan(actor, "reject");
  const submission = load(actor, id);
  assertTransition(submission.status, "REJECTED");

  if (reason.trim().length < 10) {
    throw new WorkflowError("Give a reason. A rejection with no reason cannot be learned from.");
  }

  submission.status = "REJECTED";
  submission.reviewedAt = now();
  submission.reviewedBy = actor.id;
  submission.reviewedByName = actor.name;
  submission.updatedAt = now();

  record(submission, actor, "rejected", `${actor.name} rejected ${submission.reference}: ${reason.trim()}`);
  return store.putSubmission(submission);
}

// ── Reading ────────────────────────────────────────────────────────────

export interface SubmissionFilter {
  status?: SubmissionStatus[];
  officerId?: string;
  ward?: string;
  /** Matches the reference, the officer, the ward or the address. */
  query?: string;
}

export function findSubmissions(actor: Actor, filter: SubmissionFilter = {}): PropertySubmission[] {
  let rows = store.listSubmissions().filter((row) => canTouch(actor, row));

  // Kaa never sees a draft — see `visibleStatuses`.
  if (actor.role === "kaa_operator") {
    rows = rows.filter((row) => !["DRAFT", "READY_FOR_UPLOAD", "UPLOADING"].includes(row.status));
  }

  if (filter.status?.length) rows = rows.filter((row) => filter.status!.includes(row.status));
  if (filter.officerId) rows = rows.filter((row) => row.officerId === filter.officerId);
  if (filter.ward) rows = rows.filter((row) => row.property.ward === filter.ward);

  if (filter.query) {
    const needle = filter.query.toLowerCase().trim();
    rows = rows.filter((row) =>
      [row.reference, row.officerName, row.property.ward, row.property.area, row.property.addressLine]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }

  return rows;
}

export function getSubmissionFor(actor: Actor, id: string): PropertySubmission | undefined {
  const submission = store.getSubmission(id);
  if (!submission || !canTouch(actor, submission)) return undefined;
  if (actor.role === "kaa_operator" && ["DRAFT", "READY_FOR_UPLOAD", "UPLOADING"].includes(submission.status)) {
    return undefined;
  }
  return submission;
}

export interface OperationsSummary {
  collectedToday: number;
  uploaded: number;
  underReview: number;
  correctionsRequired: number;
  approved: number;
  rejected: number;
  pendingUpload: number;
  activeOfficers: number;
  /** Approved as a share of everything Kaa has finished reviewing. */
  approvalRate: number;
}

export function operationsSummary(actor: Actor): OperationsSummary {
  const rows = findSubmissions(actor);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = (status: SubmissionStatus) => rows.filter((row) => row.status === status).length;
  const approved = count("APPROVED");
  const rejected = count("REJECTED");
  const decided = approved + rejected;

  return {
    collectedToday: rows.filter((row) => new Date(row.createdAt) >= startOfDay).length,
    uploaded: rows.filter((row) => Boolean(row.uploadedAt)).length,
    underReview: count("UPLOADED") + count("UNDER_REVIEW") + count("RESUBMITTED"),
    correctionsRequired: count("CORRECTION_REQUIRED"),
    approved,
    rejected,
    pendingUpload: count("DRAFT") + count("READY_FOR_UPLOAD") + count("UPLOADING"),
    activeOfficers: store.listOfficers().filter((officer) => officer.isActive).length,
    approvalRate: decided ? (approved / decided) * 100 : 0,
  };
}

/** The open Kaa queue, oldest first — the thing that has waited longest. */
export function reviewQueue(actor: Actor): PropertySubmission[] {
  assertCan(actor, "review");
  return findSubmissions(actor, { status: ["UPLOADED", "RESUBMITTED", "UNDER_REVIEW"] }).sort((a, b) =>
    (a.uploadedAt ?? a.createdAt).localeCompare(b.uploadedAt ?? b.createdAt),
  );
}

export { store };
