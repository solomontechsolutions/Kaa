import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson, unauthorized } from "@/lib/api";
import { getAccountId } from "@/lib/accounts/session";
import { getAccount, updateAccount } from "@/lib/accounts/store";
import { verifyOtp } from "@/lib/accounts/otp";
import { accountSummary } from "@/lib/access/session";
import { normalizePhone } from "@/lib/format";

const schema = z.object({ phone: z.string().min(9).max(20), code: z.string().min(4).max(8) });

export async function POST(request: Request) {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) return unauthorized();

    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const phone = normalizePhone(parsed.data.phone);
    if (!phone) return badRequest("Not a valid Tanzanian number");

    const result = await verifyOtp(phone, parsed.data.code);
    if (!result.ok) {
      const status = result.reason === "too_many_attempts" ? 429 : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    await updateAccount(accountId, {
      phone,
      phoneVerifiedAt: new Date().toISOString(),
      // The same number is how WhatsApp finds this account later, so the
      // conversation and the app are one tenant from the first message.
      whatsappPhone: phone,
    });

    const account = await getAccount(accountId);
    return NextResponse.json({ ok: true, account: await accountSummary(account!) });
  });
}
