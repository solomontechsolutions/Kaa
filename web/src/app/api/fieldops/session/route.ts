import { NextResponse } from "next/server";
import { z } from "zod";

import { guarded } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { FIELDOPS_COOKIE, currentActor, fieldOpsCookieOptions, issueFieldOpsToken } from "@/lib/fieldops/session";
import { getOfficer, listOfficers } from "@/lib/fieldops/store";
import { readBody } from "@/lib/fieldops/api";

const schema = z.object({ employeeId: z.string().min(2).max(40), password: z.string().min(1).max(200) });

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
 * Sign in by employee ID and password.
 *
 * Only ever matches a row in FieldOps' own employee table — `listOfficers()`
 * cannot return a Kaa operator, because no such row exists there. A Kaa
 * operator's credentials are checked against a different table entirely
 * (`/api/operators/session`), so even a correct email-shaped identifier
 * typed here has nothing to match against.
 */
export async function POST(request: Request) {
  // Wrapped in `guarded()` so a thrown error — most likely
  // KAA_SESSION_SECRET missing in production, thrown by `issueFieldOpsToken`
  // — always comes back as well-formed JSON with a 5xx status, never an
  // unhandled exception. Sign-in forms tell "wrong credentials" (4xx) apart
  // from "server misconfigured" (5xx) precisely so a missing env var never
  // shows up looking like a bad password again.
  return guarded(async () => {
    const body = await readBody<unknown>(request);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    const officer = listOfficers().find(
      (row) => row.employeeId.toLowerCase() === parsed.data.employeeId.trim().toLowerCase(),
    );

    if (!officer) return NextResponse.json({ error: "unknown_employee" }, { status: 404 });
    if (!officer.isActive) return NextResponse.json({ error: "inactive" }, { status: 403 });
    if (!verifyPassword(parsed.data.password, officer.passwordHash)) {
      return NextResponse.json({ error: "unknown_employee" }, { status: 404 });
    }

    const response = NextResponse.json({
      ok: true,
      actor: { id: officer.id, name: officer.fullName, role: officer.role },
    });
    response.cookies.set(FIELDOPS_COOKIE, issueFieldOpsToken(officer.id), fieldOpsCookieOptions);
    return response;
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FIELDOPS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
