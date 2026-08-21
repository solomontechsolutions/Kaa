/**
 * Who is signed in as a Kaa operator.
 *
 * A signed, HTTP-only cookie carrying an operator id and nothing else — the
 * same shape as the tenant, landlord and FieldOps sessions. The role is
 * always read from this store, never from the cookie: a deactivated operator
 * loses `/operators` at their next request, not their next sign-in.
 *
 * This is a separate cookie from FieldOps' (`kaa_fieldops_session`) on
 * purpose. A Kaa operator is not a FieldOps employee, and giving them a
 * different session entirely — not just a different role value on the same
 * one — is what makes that true at the infrastructure level, not just in
 * copy on a sign-in page.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Actor } from "@/lib/fieldops/permissions";
import { getOperator } from "./store";
import type { KaaOperator } from "./types";

export const OPERATOR_COOKIE = "kaa_operator_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // A shift, not a season — same as FieldOps.

function secret() {
  const value = process.env.KAA_SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("KAA_SESSION_SECRET is required in production");
  }
  return "kaa-development-secret-do-not-use-in-production";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueOperatorToken(operatorId: string): string {
  const payload = `${operatorId}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readOperatorToken(token: string | undefined): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  const [operatorId, expiry] = payload.split(".");
  if (!operatorId || !expiry || Number(expiry) < Date.now()) return null;
  return operatorId;
}

export const operatorCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * The pure lookup, taking the raw cookie value rather than reading it — the
 * form `proxy.ts` needs, since `next/headers`' `cookies()` only works inside
 * the request-scoped App Router context.
 */
export function operatorFromToken(token: string | undefined): KaaOperator | null {
  const id = readOperatorToken(token);
  if (!id) return null;
  const operator = getOperator(id);
  if (!operator || !operator.isActive) return null;
  return operator;
}

/** The `Actor` shape the FieldOps submission service and permission checks understand. */
export function actorFromToken(token: string | undefined): Actor | null {
  const operator = operatorFromToken(token);
  if (!operator) return null;
  return { id: operator.id, name: operator.fullName, role: "kaa_operator" };
}

export async function currentOperator(): Promise<KaaOperator | null> {
  const store = await cookies();
  return operatorFromToken(store.get(OPERATOR_COOKIE)?.value);
}

/** The actor for this request, in the shape FieldOps' review service expects. */
export async function currentActor(): Promise<Actor | null> {
  const operator = await currentOperator();
  if (!operator) return null;
  return { id: operator.id, name: operator.fullName, role: "kaa_operator" };
}

/** Every operator page calls this rather than trusting a layout's redirect — see the note on `proxy.ts`. */
export async function requireOperator(): Promise<KaaOperator> {
  const operator = await currentOperator();
  if (!operator) redirect("/operators/sign-in");
  return operator;
}

/** The `Actor`-shaped equivalent, for pages that call straight into FieldOps' submission service. */
export async function requireActor(): Promise<Actor> {
  const operator = await requireOperator();
  return { id: operator.id, name: operator.fullName, role: "kaa_operator" };
}
