import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson, unauthorized } from "@/lib/api";
import { getAccountId } from "@/lib/accounts/session";
import { findAccountByPhone, getAccount } from "@/lib/accounts/store";
import { sendOtp } from "@/lib/accounts/otp";
import { normalizePhone } from "@/lib/format";

const schema = z.object({ phone: z.string().min(9).max(20) });

/** Step two: prove the tenant is holding the number they gave. */
export async function POST(request: Request) {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) return unauthorized();

    const account = await getAccount(accountId);
    if (!account) return unauthorized();

    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "invalid_phone", message: "That is not a Tanzanian mobile number." },
        { status: 400 },
      );
    }

    // One number, one account. Otherwise two NIDA identities could share a
    // phone and the WhatsApp linking below would be ambiguous.
    const owner = await findAccountByPhone(phone);
    if (owner && owner.id !== accountId) {
      return NextResponse.json({ error: "phone_taken" }, { status: 409 });
    }

    const result = await sendOtp(phone);
    if (!result.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    return NextResponse.json({
      ok: true,
      phone,
      expiresAt: new Date(result.expiresAt).toISOString(),
      /** False when no SMS provider is configured; the code is in the server log. */
      delivered: result.delivered,
    });
  });
}
