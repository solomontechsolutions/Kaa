/**
 * FieldOps storage.
 *
 * Same posture as the rest of Kaa: an in-process store so the whole workflow
 * runs without a database, behind an interface a Postgres implementation can
 * take over without the service above it changing. `0004_fieldops.sql` is the
 * schema it moves onto.
 *
 * Per-process and resets on deploy — a development store, never an
 * operational one.
 */

import type { Assignment, AuditEvent, FieldOfficer, PropertySubmission } from "./types";
import { seedOfficers, seedSubmissions, seedAssignments } from "./seed";

interface Tables {
  submissions: Map<string, PropertySubmission>;
  officers: Map<string, FieldOfficer>;
  assignments: Map<string, Assignment>;
  /** Monotonic, for KA-000241. */
  nextReference: number;
}

const globalStore = globalThis as unknown as { __kaaFieldOps?: Tables };

function tables(): Tables {
  if (!globalStore.__kaaFieldOps) {
    const submissions = new Map(seedSubmissions().map((row) => [row.id, row]));
    globalStore.__kaaFieldOps = {
      submissions,
      officers: new Map(seedOfficers().map((row) => [row.id, row])),
      assignments: new Map(seedAssignments().map((row) => [row.id, row])),
      nextReference:
        Math.max(0, ...[...submissions.values()].map((s) => Number(s.reference.split("-")[1]) || 0)) + 1,
    };
  }
  return globalStore.__kaaFieldOps;
}

export function nextReference(): string {
  const db = tables();
  const value = db.nextReference++;
  return `KA-${String(value).padStart(6, "0")}`;
}

// ── Submissions ────────────────────────────────────────────────────────

export function listSubmissions(): PropertySubmission[] {
  return [...tables().submissions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSubmission(idOrReference: string): PropertySubmission | undefined {
  const db = tables();
  return (
    db.submissions.get(idOrReference) ??
    [...db.submissions.values()].find((row) => row.reference === idOrReference)
  );
}

export function putSubmission(submission: PropertySubmission): PropertySubmission {
  tables().submissions.set(submission.id, submission);
  return submission;
}

export function deleteSubmission(id: string): void {
  tables().submissions.delete(id);
}

// ── People and assignments ─────────────────────────────────────────────

export function listOfficers(): FieldOfficer[] {
  return [...tables().officers.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function getOfficer(id: string): FieldOfficer | undefined {
  return tables().officers.get(id);
}

export function putOfficer(officer: FieldOfficer): FieldOfficer {
  tables().officers.set(officer.id, officer);
  return officer;
}

export function listAssignments(officerId?: string): Assignment[] {
  const rows = [...tables().assignments.values()];
  return (officerId ? rows.filter((row) => row.officerId === officerId) : rows).sort((a, b) =>
    a.dueOn.localeCompare(b.dueOn),
  );
}

/** Every audit line across every submission, newest first — the activity feed. */
export function listActivity(limit = 50): AuditEvent[] {
  return listSubmissions()
    .flatMap((submission) => submission.history)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

/** Test hook. */
export function __resetFieldOps() {
  globalStore.__kaaFieldOps = undefined;
}
