import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson } from "@/lib/api";
import { verifyOtp } from "@/lib/accounts/otp";
import { findLandlordByPhone } from "@/lib/landlords/store";
import {
  LANDLORD_COOKIE,
  currentLandlord,
  issueLandlordToken,
  landlordCookieOptions,
} from "@/lib/landlords/session";
import { normalizePhone } from "@/lib/format";

/** Who am I? Used by the landlord portal shell on load. */
export async function GET() {
  const landlord = await currentLandlord();
  return NextResponse.json({ landlord });
}

const schema = z.object({ phone: z.string().min(9).max(20), code: z.string().min(4).max(8) });

/**
 * Step two: the code proves the landlord is holding the phone that was
 * enrolled. Only that phone's own OTP challenge can complete this — the
 * lookup in `otp/request` and the one here both key off the normalised
 * number, so there is no way to verify a code against a different landlord's
 * phone.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) return badRequest("Not a valid Tanzanian number");

    const result = await verifyOtp(phone, parsed.data.code);
    if (!result.ok) {
      const status = result.reason === "too_many_attempts" ? 429 : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    const landlord = findLandlordByPhone(phone);
    if (!landlord || !landlord.isActive) {
      return NextResponse.json({ error: "not_a_landlord" }, { status: 404 });
    }

    const response = NextResponse.json({ ok: true, landlord });
    response.cookies.set(LANDLORD_COOKIE, issueLandlordToken(landlord.id), landlordCookieOptions);
    return response;
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LANDLORD_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
