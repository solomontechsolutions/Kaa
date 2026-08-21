import { NextResponse } from "next/server";
import { z } from "zod";

import { FIELDOPS_COOKIE, currentActor, fieldOpsCookieOptions, issueFieldOpsToken } from "@/lib/fieldops/session";
import { getOfficer, listOfficers } from "@/lib/fieldops/store";
import { readBody } from "@/lib/fieldops/api";

const schema = z.object({ employeeId: z.string().min(2).max(40) });

/** Who am I? Used by both the portal and the handset app on load. */
export async function GET() {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ actor: null });

  const officer = getOfficer(actor.id)!;
  return NextResponse.json({
    actor,
    officer: {
      employeeId: officer.employeeId,
      fullName: officer.fullName,
      role: officer.role,
      assignedAreas: officer.assignedAreas,
      deviceId: officer.deviceId,
    },
  });
}

/**
 * Sign in by employee ID.
 *
 * No password yet, and that is stated rather than hidden: FieldOps issues the
 * handsets and the portal is not public, so this is identification, not
 * authentication. Before this carries real operational data it needs a
 * credential — the boundary is here, in one function, so adding one does not
 * touch anything above it.
 */
export async function POST(request: Request) {
  const body = await readBody<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const officer = listOfficers().find(
    (row) => row.employeeId.toLowerCase() === parsed.data.employeeId.trim().toLowerCase(),
  );

  if (!officer) return NextResponse.json({ error: "unknown_employee" }, { status: 404 });
  if (!officer.isActive) return NextResponse.json({ error: "inactive" }, { status: 403 });

  const response = NextResponse.json({
    ok: true,
    actor: { id: officer.id, name: officer.fullName, role: officer.role },
  });
  response.cookies.set(FIELDOPS_COOKIE, issueFieldOpsToken(officer.id), fieldOpsCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FIELDOPS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
