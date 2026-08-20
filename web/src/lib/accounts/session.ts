/**
 * The tenant session.
 *
 * A signed, HTTP-only cookie carrying an account id and nothing else. No
 * membership flag, no entitlement, no NIDA state — those are read from the
 * store on every request, so a stale cookie can never grant access that has
 * lapsed, and a tampered one fails its signature.
 *
 * Supabase Auth remains the plan for phone sign-in on the operator side; this
 * is the tenant-side session for the NIDA + OTP flow, which is not a Supabase
 * auth flow. `getAccountId()` is the only way anything learns who is calling.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kaa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

function secret() {
  const value = process.env.KAA_SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    // Refusing is the right failure here. Signing with a default in production
    // means anyone who reads this file can mint a session for any account.
    throw new Error("KAA_SESSION_SECRET is required in production");
  }
  return "kaa-development-secret-do-not-use-in-production";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueToken(accountId: string): string {
  const payload = `${accountId}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readToken(token: string | undefined): string | null {
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

  const [accountId, expiry] = payload.split(".");
  if (!accountId || !expiry || Number(expiry) < Date.now()) return null;
  return accountId;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** The signed-in account id for this request, or null. */
export async function getAccountId(): Promise<string | null> {
  const store = await cookies();
  return readToken(store.get(SESSION_COOKIE)?.value);
}
