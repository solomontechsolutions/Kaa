import { beforeEach, describe, expect, it } from "vitest";

import { __resetFieldOps, getSubmission, listActivity } from "@/lib/fieldops/store";
import { ForbiddenError } from "@/lib/fieldops/permissions";
import {
  WorkflowError,
  approve,
  createDraft,
  captureGps,
  addPhoto,
  findSubmissions,
  markReady,
  openForReview,
  operationsSummary,
  readiness,
  reject,
  requestCorrection,
  reviewQueue,
  updateDraft,
  upload,
} from "@/lib/fieldops/service";
import type { Actor } from "@/lib/fieldops/permissions";

const OFFICER: Actor = { id: "fo-hamisi", name: "Hamisi Mwakalinga", role: "field_officer" };
const OTHER_OFFICER: Actor = { id: "fo-asha", name: "Asha Mbwana", role: "field_officer" };
const SUPERVISOR: Actor = { id: "fs-rehema", name: "Rehema Nassoro", role: "fieldops_supervisor" };
const KAA: Actor = { id: "ko-sarah", name: "Sarah Mushi", role: "kaa_operator" };

beforeEach(() => {
  __resetFieldOps();
});

/** Fill a draft to the point Kaa could actually review it. */
function complete(actor: Actor) {
  const draft = createDraft(actor, { ward: "Mikocheni", district: "Kinondoni" });
  updateDraft(actor, draft.id, {
    propertyKind: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 650_000,
    landlordName: "Ally Nassoro",
    landlordPhone: "+255784000500",
    landlordConsent: true,
  });
  captureGps(actor, draft.id, { latitude: -6.77, longitude: 39.26, accuracyM: 8 });
  for (const room of ["exterior", "living_room", "bedroom"] as const) {
    addPhoto(actor, draft.id, { room, uri: `blob:${room}`, capturedAt: new Date().toISOString() });
  }
  return getSubmission(draft.id)!;
}

describe("collecting", () => {
  it("starts a draft owned by whoever is signed in", () => {
    const draft = createDraft(OFFICER);
    expect(draft.status).toBe("DRAFT");
    expect(draft.officerId).toBe(OFFICER.id);
    expect(draft.reference).toMatch(/^KA-\d{6}$/);
  });

  it("will not upload something Kaa cannot review, and says exactly what is missing", () => {
    const draft = createDraft(OFFICER);
    const check = readiness(draft);

    expect(check.ready).toBe(false);
    expect(check.missing).toEqual(
      expect.arrayContaining(["Property type", "Monthly rent", "GPS location", "An exterior photo"]),
    );
    expect(() => markReady(OFFICER, draft.id)).toThrowError(WorkflowError);
  });

  it("refuses a GPS fix too coarse to identify a building", () => {
    const draft = complete(OFFICER);
    captureGps(OFFICER, draft.id, { latitude: -6.77, longitude: 39.26, accuracyM: 320 });
    expect(readiness(getSubmission(draft.id)!).missing).toContain("A GPS fix better than 50 m");
  });

  it("requires the landlord's consent, because the landlord never signs up themselves", () => {
    const draft = complete(OFFICER);
    updateDraft(OFFICER, draft.id, { landlordConsent: false });
    expect(readiness(getSubmission(draft.id)!).missing).toContain("Landlord consent to enrol");
  });

  it("is ready once everything Kaa needs is there", () => {
    const draft = complete(OFFICER);
    expect(readiness(draft)).toMatchObject({ ready: true, missing: [] });
    expect(markReady(OFFICER, draft.id).status).toBe("READY_FOR_UPLOAD");
  });

  it("keeps one officer out of another's work", () => {
    const draft = complete(OFFICER);
    expect(() => updateDraft(OTHER_OFFICER, draft.id, { bedrooms: 9 })).toThrowError(ForbiddenError);
  });
});

describe("the review loop", () => {
  it("goes draft → upload → review → approved", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);

    expect(upload(OFFICER, draft.id).status).toBe("UPLOADED");
    expect(openForReview(KAA, draft.id).status).toBe("UNDER_REVIEW");

    const { submission, kaaUnitId } = approve(KAA, draft.id);
    expect(submission.status).toBe("APPROVED");
    // The one door between the two entities: FieldOps' record becomes Kaa's.
    expect(kaaUnitId).toBeTruthy();
    expect(submission.kaaUnitId).toBe(kaaUnitId);
  });

  it("sends work back with the operator's words attached", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    openForReview(KAA, draft.id);

    const message =
      "Please correct the monthly rent. You entered 450,000 but the landlord confirmed 500,000.";
    const sent = requestCorrection(KAA, draft.id, { message, fields: ["monthlyRent"] });

    expect(sent.status).toBe("CORRECTION_REQUIRED");
    expect(sent.corrections).toHaveLength(1);
    expect(sent.corrections[0]!.message).toBe(message);
    expect(sent.corrections[0]!.fields).toContain("monthlyRent");
    expect(sent.corrections[0]!.resolvedAt).toBeUndefined();
  });

  it("refuses to send work back without saying why", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    openForReview(KAA, draft.id);

    expect(() => requestCorrection(KAA, draft.id, { message: "wrong" })).toThrowError(WorkflowError);
  });

  it("lets the officer edit and re-upload, and closes the correction", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    openForReview(KAA, draft.id);
    requestCorrection(KAA, draft.id, { message: "Rent is wrong, the landlord confirmed 500,000." });

    updateDraft(OFFICER, draft.id, { monthlyRent: 500_000 });
    const resubmitted = upload(OFFICER, draft.id);

    expect(resubmitted.status).toBe("RESUBMITTED");
    expect(resubmitted.submissionCount).toBe(2);
    expect(resubmitted.corrections[0]!.resolvedAt).toBeTruthy();
    expect(resubmitted.property.monthlyRent).toBe(500_000);
  });

  it("puts a resubmission back in the Kaa queue", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    openForReview(KAA, draft.id);
    requestCorrection(KAA, draft.id, { message: "Rent is wrong, please check with the landlord." });
    upload(OFFICER, draft.id);

    expect(reviewQueue(KAA).map((row) => row.id)).toContain(draft.id);
  });

  it("will not let an officer edit while Kaa has it", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);

    expect(() => updateDraft(OFFICER, draft.id, { monthlyRent: 1 })).toThrowError(WorkflowError);
  });

  it("will not let anyone edit what Kaa already approved", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    approve(KAA, draft.id);

    expect(() => updateDraft(OFFICER, draft.id, { monthlyRent: 1 })).toThrowError(WorkflowError);
  });

  it("refuses a rejection with no reason", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    expect(() => reject(KAA, draft.id, "no")).toThrowError(WorkflowError);
  });

  it("refuses an illegal jump", () => {
    const draft = complete(OFFICER);
    // Nothing reaches Kaa without being uploaded first.
    expect(() => approve(KAA, draft.id)).toThrowError();
  });
});

describe("who may do what", () => {
  it("does not let a field officer approve their own work", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);

    expect(() => approve(OFFICER, draft.id)).toThrowError(ForbiddenError);
    expect(() => requestCorrection(OFFICER, draft.id, { message: "looks fine to me honestly" })).toThrowError(ForbiddenError);
    expect(() => reject(OFFICER, draft.id, "changed my mind about this")).toThrowError(ForbiddenError);
  });

  it("does not let a supervisor approve either — that is Kaa's call", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    expect(() => approve(SUPERVISOR, draft.id)).toThrowError(ForbiddenError);
  });

  it("does not let a Kaa operator collect", () => {
    expect(() => createDraft(KAA)).toThrowError(ForbiddenError);
  });

  it("hides drafts from Kaa — an unfinished record is not a submission", () => {
    createDraft(OFFICER);
    const kaaSees = findSubmissions(KAA);
    expect(kaaSees.every((row) => !["DRAFT", "READY_FOR_UPLOAD", "UPLOADING"].includes(row.status))).toBe(true);
  });

  it("shows an officer only their own", () => {
    const rows = findSubmissions(OFFICER);
    expect(rows.every((row) => row.officerId === OFFICER.id)).toBe(true);
  });

  it("shows a supervisor the whole operation", () => {
    expect(findSubmissions(SUPERVISOR).length).toBeGreaterThan(findSubmissions(OFFICER).length);
  });
});

describe("the audit trail", () => {
  it("records every step, with who did it", () => {
    const draft = complete(OFFICER);
    markReady(OFFICER, draft.id);
    upload(OFFICER, draft.id);
    openForReview(KAA, draft.id);
    requestCorrection(KAA, draft.id, { message: "Please recapture the GPS at the gate." });
    upload(OFFICER, draft.id);
    approve(KAA, draft.id);

    const actions = getSubmission(draft.id)!.history.map((event) => event.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "created", "edited", "gps_captured", "photo_added", "marked_ready",
        "uploaded", "opened_for_review", "correction_requested", "resubmitted", "approved",
      ]),
    );

    const approval = getSubmission(draft.id)!.history.find((event) => event.action === "approved")!;
    expect(approval.actorName).toBe(KAA.name);
    expect(approval.actorRole).toBe("kaa_operator");
  });

  it("stays in order", () => {
    const draft = complete(OFFICER);
    const times = getSubmission(draft.id)!.history.map((event) => event.at);
    expect(times).toEqual([...times].sort());
  });

  it("feeds the activity stream", () => {
    expect(listActivity(10).length).toBeGreaterThan(0);
  });
});

describe("the seeded operation", () => {
  it("puts every state on screen for the portal", () => {
    const statuses = new Set(findSubmissions(SUPERVISOR).map((row) => row.status));
    expect(statuses).toContain("UNDER_REVIEW");
    expect(statuses).toContain("CORRECTION_REQUIRED");
    expect(statuses).toContain("APPROVED");
    expect(statuses).toContain("REJECTED");
    expect(statuses).toContain("UPLOADED");
  });

  it("summarises the operation", () => {
    const summary = operationsSummary(SUPERVISOR);
    expect(summary.approved).toBeGreaterThan(0);
    expect(summary.underReview).toBeGreaterThan(0);
    expect(summary.approvalRate).toBeGreaterThan(0);
    expect(summary.activeOfficers).toBeGreaterThan(0);
  });
});
