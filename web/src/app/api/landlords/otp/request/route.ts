import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson } from "@/lib/api";
import { sendOtp } from "@/lib/accounts/otp";
import { findLandlordByPhone } from "@/lib/landlords/store";
import { normalizePhone } from "@/lib/format";

const schema = z.object({ phone: z.string().min(9).max(20) });

/**
 * Step one of landlord sign-in: prove the phone belongs to an enrolled
 * landlord before sending a code to it.
 *
 * There is no landlord self-registration — a landlord becomes one when a
 * FieldOps officer enrols their property, the same way there is no tenant
 * self-registration outside the NIDA flow. A number that is not on a
 * landlord record says so plainly rather than pretending a code was sent.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "invalid_phone", message: "That is not a Tanzanian mobile number." },
        { status: 400 },
      );
    }

    const landlord = findLandlordByPhone(phone);
    if (!landlord || !landlord.isActive) {
      return NextResponse.json({ error: "not_a_landlord" }, { status: 404 });
    }

    const result = await sendOtp(phone);
    if (!result.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    return NextResponse.json({
      ok: true,
      phone,
      expiresAt: new Date(result.expiresAt).toISOString(),
      delivered: result.delivered,
    });
  });
}
