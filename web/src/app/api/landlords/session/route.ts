import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { verifyOtp } from "@/lib/accounts/otp";
import { findLandlordByEmail, findLandlordByPhone } from "@/lib/landlords/store";
import {
  LANDLORD_COOKIE,
  currentLandlord,
  issueLandlordToken,
  landlordCookieOptions,
} from "@/lib/landlords/session";
import { normalizePhone } from "@/lib/format";
import type { Landlord } from "@/lib/landlords/types";

/** What the client is ever allowed to see about a landlord. Never `passwordHash`. */
function publicLandlord(landlord: Landlord) {
  return {
    id: landlord.id,
    fullName: landlord.fullName,
    phone: landlord.phone,
    email: landlord.email,
    orgId: landlord.orgId,
  };
}

/** Who am I? Used by the landlord portal shell on load. */
export async function GET() {
  const landlord = await currentLandlord();
  return NextResponse.json({ landlord: landlord && publicLandlord(landlord) });
}

const otpSchema = z.object({ phone: z.string().min(9).max(20), code: z.string().min(4).max(8) });
const passwordSchema = z.object({ email: z.string().email().max(120), password: z.string().min(1).max(200) });
const schema = z.union([otpSchema, passwordSchema]);

/**
 * Two ways in, one session. A landlord enrolled without an email can only
 * use the phone + OTP branch; one with an email may use either. Both check
 * a real credential against the same table — there is no bare "sign in by
 * phone alone" path here.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const body = await readJson<unknown>(request);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest();

    const landlord =
      "email" in parsed.data
        ? await signInWithPassword(parsed.data)
        : await signInWithOtp(parsed.data);

    if (landlord === "invalid") return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    if (landlord === "rate_limited") return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    if (!landlord) return NextResponse.json({ error: "not_a_landlord" }, { status: 404 });

    const response = NextResponse.json({ ok: true, landlord: publicLandlord(landlord) });
    response.cookies.set(LANDLORD_COOKIE, issueLandlordToken(landlord.id), landlordCookieOptions);
    return response;
  });
}

async function signInWithPassword(data: { email: string; password: string }) {
  const landlord = findLandlordByEmail(data.email);
  if (!landlord || !landlord.isActive) return null;
  if (!verifyPassword(data.password, landlord.passwordHash)) return "invalid" as const;
  return landlord;
}

async function signInWithOtp(data: { phone: string; code: string }) {
  const phone = normalizePhone(data.phone);
  if (!phone) return null;

  const result = await verifyOtp(phone, data.code);
  if (!result.ok) return result.reason === "too_many_attempts" ? ("rate_limited" as const) : ("invalid" as const);

  const landlord = findLandlordByPhone(phone);
  if (!landlord || !landlord.isActive) return null;
  return landlord;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LANDLORD_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
