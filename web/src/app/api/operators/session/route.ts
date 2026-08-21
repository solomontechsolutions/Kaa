import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { findOperatorByIdentifier } from "@/lib/operators/store";
import {
  OPERATOR_COOKIE,
  currentOperator,
  issueOperatorToken,
  operatorCookieOptions,
} from "@/lib/operators/session";

/** Who am I? Used by the operators shell on load. Never echoes the password hash. */
export async function GET() {
  const operator = await currentOperator();
  return NextResponse.json({
    operator: operator && { id: operator.id, employeeId: operator.employeeId, fullName: operator.fullName, email: operator.email },
  });
}

const schema = z.object({
  identifier: z.string().min(2).max(120),
  password: z.string().min(1).max(200),
});

/**
 * Kaa staff sign-in: employee id or email, plus a real password.
 *
 * This is a separate store and a separate cookie from FieldOps' — see
 * `lib/operators/session.ts`. A correct password against the wrong store
 * cannot happen; there is no shared table for the two identifiers to
 * collide in.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const operator = findOperatorByIdentifier(parsed.data.identifier);
    if (!operator || !operator.isActive) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (!verifyPassword(parsed.data.password, operator.passwordHash)) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      operator: { id: operator.id, employeeId: operator.employeeId, fullName: operator.fullName, email: operator.email },
    });
    response.cookies.set(OPERATOR_COOKIE, issueOperatorToken(operator.id), operatorCookieOptions);
    return response;
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPERATOR_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
