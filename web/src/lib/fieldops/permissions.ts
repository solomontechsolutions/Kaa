/**
 * Who may do what.
 *
 * The rule that matters most: a field officer cannot approve their own work.
 * The whole point of the review loop is that the entity collecting the data is
 * not the entity accepting it — FieldOps collects, Kaa accepts. Collapse that
 * and the verification Kaa sells to tenants means nothing.
 */

import type { FieldOpsRole, PropertySubmission, SubmissionStatus } from "./types";

export interface Actor {
  id: string;
  name: string;
  role: FieldOpsRole;
}

export type Capability =
  | "collect"          // create and edit own drafts
  | "upload"           // send own submission to Kaa
  | "resubmit"         // answer a correction request
  | "view_own"         // see own submissions
  | "view_all_fieldops" // supervisor: see the whole FieldOps operation
  | "manage_officers"
  | "manage_assignments"
  | "review"           // Kaa: open a submission for review
  | "approve"          // Kaa: accept into the Kaa property database
  | "request_correction"
  | "reject";

const CAPABILITIES: Record<FieldOpsRole, Capability[]> = {
  field_officer: ["collect", "upload", "resubmit", "view_own"],
  fieldops_supervisor: ["view_own", "view_all_fieldops", "manage_officers", "manage_assignments"],
  // Kaa's side. Note what is absent: no `collect`, no `upload`. A Kaa operator
  // does not create field data, so there is no path by which the reviewer is
  // also the collector.
  kaa_operator: ["view_all_fieldops", "review", "approve", "request_correction", "reject"],
};

export function can(actor: Actor, capability: Capability): boolean {
  return CAPABILITIES[actor.role]?.includes(capability) ?? false;
}

/** A field officer may only ever touch their own work. */
export function canTouch(actor: Actor, submission: PropertySubmission): boolean {
  if (actor.role === "field_officer") return submission.officerId === actor.id;
  return can(actor, "view_all_fieldops");
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertCan(actor: Actor, capability: Capability) {
  if (!can(actor, capability)) throw new ForbiddenError();
}

/**
 * Which statuses a role is allowed to see at all.
 *
 * Kaa never sees a draft. An officer's half-filled record sitting on a handset
 * is FieldOps' internal working state, and putting it in Kaa's queue would
 * mean reviewing work nobody has claimed is finished.
 */
export function visibleStatuses(role: FieldOpsRole): SubmissionStatus[] {
  const shared: SubmissionStatus[] = [
    "UPLOADED",
    "UNDER_REVIEW",
    "CORRECTION_REQUIRED",
    "RESUBMITTED",
    "APPROVED",
    "REJECTED",
  ];

  if (role === "kaa_operator") return shared;
  return ["DRAFT", "READY_FOR_UPLOAD", "UPLOADING", ...shared];
}
