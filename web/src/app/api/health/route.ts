import { NextResponse } from "next/server";

import { storeKind } from "@/lib/accounts/store";
import { findLandlordByEmail } from "@/lib/landlords/store";
import { findOperatorByEmployeeId } from "@/lib/operators/store";
import { listOfficers } from "@/lib/fieldops/store";
import { DEMO_FIELDOPS_ADMIN, DEMO_FIELDOPS_OFFICER, DEMO_KAA_OPERATOR, DEMO_LANDLORD } from "@/lib/demo/credentials";

/**
 * Unauthenticated, no secrets in the response — a diagnostic endpoint for
 * exactly one question: "is this deployment actually the build I think it
 * is, with the config it needs?" Nothing here proves whether a password is
 * *right*, only whether the pieces sign-in depends on are in place at all —
 * the commit, the session secret, the seeded demo rows.
 *
 * Built because a wrong-role or wrong-password error and a server 500 from
 * a missing env var were rendering as the identical "not right" message on
 * every sign-in form, and there was no way to tell them apart without
 * dashboard access to whichever Vercel project served the request.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV,
      surface: process.env.NEXT_PUBLIC_KAA_SURFACE ?? "main",
    },
    config: {
      // Booleans only. If any of these is false, every password-based
      // sign-in on this deployment will fail with a 500 that the frontend
      // currently shows as "credentials not right" — see the note on
      // KAA_SESSION_SECRET required-in-production in lib/*/session.ts.
      sessionSecretConfigured: Boolean(process.env.KAA_SESSION_SECRET),
      nidaHashSaltConfigured: Boolean(process.env.NIDA_HASH_SALT),
      accountStore: storeKind(),
    },
    demoAccountsSeeded: {
      kaaOperator: Boolean(findOperatorByEmployeeId(DEMO_KAA_OPERATOR.employeeId)),
      landlord: Boolean(findLandlordByEmail(DEMO_LANDLORD.email)),
      fieldOpsOfficer: listOfficers().some((o) => o.employeeId === DEMO_FIELDOPS_OFFICER.employeeId),
      fieldOpsAdmin: listOfficers().some((o) => o.employeeId === DEMO_FIELDOPS_ADMIN.employeeId),
    },
  });
}
