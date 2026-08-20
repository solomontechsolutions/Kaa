import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson, unauthorized } from "@/lib/api";
import { getAccountId } from "@/lib/accounts/session";
import { getAccount } from "@/lib/accounts/store";
import { normalizePhone } from "@/lib/format";
import { startCheckout, TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

const schema = z.object({ phone: z.string().min(9).max(20).optional(), returnTo: z.string().max(300).optional() });

/**
 * Start the TZS 10,000 payment.
 *
 * This grants nothing. It creates a pending row and pushes a prompt to the
 * tenant's phone; access appears only when the provider confirms on the
 * webhook. A client that calls this and then claims to be a member is still
 * a free user on the next request.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) return unauthorized();

    const account = await getAccount(accountId);
    if (!account) return unauthorized();

    // Membership is bought against a confirmed identity, not an anonymous one.
    if (account.nidaStatus !== "verified" || !account.phoneVerifiedAt) {
      return NextResponse.json({ error: "verification_required" }, { status: 403 });
    }

    const parsed = schema.safeParse((await readJson<unknown>(request)) ?? {});
    if (!parsed.success) return badRequest();

    const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : account.phone;
    if (!phone) return badRequest("A mobile money number is needed");

    const result = await startCheckout({ accountId, phone, returnTo: parsed.data.returnTo });

    return NextResponse.json({
      ok: true,
      status: "pending",
      paymentReference: result.paymentReference,
      amount: TENANT_ANNUAL_PRICE_TZS,
      currency: "TZS",
      months: 12,
      checkoutUrl: result.checkoutUrl,
      /** False on a deployment with no payment provider — nothing can confirm. */
      providerConfigured: result.providerConfigured,
    });
  });
}
