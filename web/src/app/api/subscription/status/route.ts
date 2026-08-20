import { NextResponse } from "next/server";

import { guarded } from "@/lib/api";
import { getAccountId } from "@/lib/accounts/session";
import { getMembership, TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

/**
 * Membership status, polled by the unlock screen while a payment is in flight.
 * Derived from the subscription rows on every call, so it flips the moment the
 * webhook lands and not a request earlier.
 */
export async function GET() {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) {
      return NextResponse.json({ active: false, price: { amount: TENANT_ANNUAL_PRICE_TZS, currency: "TZS" } });
    }

    const membership = await getMembership(accountId);
    return NextResponse.json({
      active: membership.active,
      endsAt: membership.endsAt,
      pending: Boolean(membership.pending),
      price: { amount: TENANT_ANNUAL_PRICE_TZS, currency: "TZS", period: "year" },
    });
  });
}
