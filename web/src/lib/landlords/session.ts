/**
 * Who is signed in to the landlord portal.
 *
 * Same shape as the tenant and FieldOps sessions: a signed, HTTP-only cookie
 * carrying a landlord id and nothing else. The landlord's org — and so which
 * properties they may see — is read from the store on every request, never
 * trusted from the cookie.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getLandlord } from "./store";
import type { Landlord } from "./types";

export const LANDLORD_COOKIE = "kaa_landlord_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90;

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

export function issueLandlordToken(landlordId: string): string {
  const payload = `${landlordId}.${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readLandlordToken(token: string | undefined): string | null {
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

  const [landlordId, expiry] = payload.split(".");
  if (!landlordId || !expiry || Number(expiry) < Date.now()) return null;
  return landlordId;
}

export const landlordCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export async function currentLandlordId(): Promise<string | null> {
  const store = await cookies();
  return readLandlordToken(store.get(LANDLORD_COOKIE)?.value);
}

/**
 * The pure lookup, taking the raw cookie value rather than reading it — the
 * form `proxy.ts` needs, since `next/headers`' `cookies()` only works inside
 * the App Router's request-scoped context. See the equivalent in
 * `lib/fieldops/session.ts` for why this split exists.
 */
export function landlordFromToken(token: string | undefined): Landlord | null {
  const id = readLandlordToken(token);
  if (!id) return null;
  const landlord = getLandlord(id);
  if (!landlord || !landlord.isActive) return null;
  return landlord;
}

/** The signed-in landlord for this request, or null. Deactivation revokes access immediately. */
export async function currentLandlord(): Promise<Landlord | null> {
  const store = await cookies();
  return landlordFromToken(store.get(LANDLORD_COOKIE)?.value);
}

/** Every landlord page calls this rather than trusting a layout redirect. */
export async function requireLandlord(): Promise<Landlord> {
  const landlord = await currentLandlord();
  if (!landlord) redirect("/landlord/sign-in");
  return landlord;
}
