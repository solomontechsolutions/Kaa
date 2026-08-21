import { NextResponse } from "next/server";

import { withActor } from "@/lib/fieldops/api";
import { assertCan } from "@/lib/fieldops/permissions";
import { findSubmissions } from "@/lib/fieldops/service";
import { listAssignments, listOfficers } from "@/lib/fieldops/store";

/**
 * The officers, each with what they have actually produced.
 *
 * Supervisor and Kaa-operator only. A field officer has no business seeing a
 * colleague's approval rate.
 */
export async function GET() {
  return withActor(async (actor) => {
    assertCan(actor, "view_all_fieldops");

    const all = findSubmissions(actor);

    const officers = listOfficers()
      .filter((officer) => officer.role === "field_officer")
      .map((officer) => {
        const mine = all.filter((row) => row.officerId === officer.id);
        return {
          ...officer,
          collected: mine.length,
          approved: mine.filter((row) => row.status === "APPROVED").length,
          pending: mine.filter((row) => ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(row.status)).length,
          corrections: mine.filter((row) => row.status === "CORRECTION_REQUIRED").length,
          assignments: listAssignments(officer.id),
        };
      });

    return NextResponse.json({ officers });
  });
}
