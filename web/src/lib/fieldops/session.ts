/**
 * Who is using FieldOps.
 *
 * A signed cookie carrying an officer id, exactly like the tenant session:
 * the role is read from the officer record on every request, never from the
 * cookie, so a tampered cookie cannot promote a field officer to a Kaa
 * operator.
 *
 * Kaa operators sign in here too. They are not FieldOps employees — the
 * `kaa_operator` role exists in this table because the review workflow spans
 * both entities and someone has to be identifiable on Kaa's side of it.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getOfficer } from "./store";
import type { Actor } from "./permissions";

export const FIELDOPS_COOKIE = "kaa_fieldops_session";
const TTL_SECONDS = 60 * 60 * 12; // A shift, not a season.

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

export function issueFieldOpsToken(officerId: string): string {
  const payload = `${officerId}.${Date.now() + TTL_SECONDS * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readFieldOpsToken(token: string | undefined): string | null {
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

  const [officerId, expiry] = payload.split(".");
  if (!officerId || !expiry || Number(expiry) < Date.now()) return null;
  return officerId;
}

export const fieldOpsCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_SECONDS,
};

/**
 * The pure lookup, taking the raw cookie value rather than reading it.
 *
 * `next/headers`' `cookies()` only works inside the App Router's
 * request-scoped context (Server Components, Route Handlers) — not inside
 * `proxy.ts`, which gets the cookie from `NextRequest` instead. Both callers
 * need the same rule — role comes from the officer record, not the cookie,
 * so a deactivated officer loses access at their next request rather than
 * their next sign-in — so that rule lives here once.
 */
export function actorFromToken(token: string | undefined): Actor | null {
  const officerId = readFieldOpsToken(token);
  if (!officerId) return null;

  const officer = getOfficer(officerId);
  if (!officer || !officer.isActive) return null;

  return { id: officer.id, name: officer.fullName, role: officer.role };
}

/** The actor for this request, or null when nobody is signed in. */
export async function currentActor(): Promise<Actor | null> {
  const store = await cookies();
  return actorFromToken(store.get(FIELDOPS_COOKIE)?.value);
}

/**
 * The actor, or off to sign in.
 *
 * Every portal page calls this rather than asserting the layout already
 * redirected. In the App Router a layout and its page render **in parallel**,
 * so a `redirect()` upstairs does not stop the page below from running — it
 * throws `null` dereferences into the log while the redirect is still in
 * flight. Each page has to establish its own caller.
 */
export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect("/field/sign-in");
  return actor;
}
