/**
 * Kaa membership — TZS 10,000 for 12 months.
 *
 * One service. The mobile app, the website and the WhatsApp webhook all call
 * this; there is no WhatsApp subscription, no web subscription, no mobile
 * subscription. A tenant who pays inside a WhatsApp conversation is a member
 * when they open the app thirty seconds later, because it is the same row.
 *
 * The state machine has exactly one path to `active`:
 *
 *     checkout() → pending → [provider confirms via webhook] → active
 *
 * Nothing else activates a membership. Initiating a payment does not, a client
 * telling us it paid does not, and a retry of a webhook that already landed
 * does not extend anything — `confirmPayment` is idempotent on the provider
 * reference.
 */

import { randomUUID } from "node:crypto";

import {
  createSubscription,
  findSubscriptionByPaymentReference,
  listSubscriptions,
  updateSubscription,
} from "@/lib/accounts/store";
import type { Subscription } from "@/lib/accounts/types";

/** Whole shillings. The only price a tenant pays Kaa. */
export const TENANT_ANNUAL_PRICE_TZS = 10_000;
export const TENANT_PLAN = "tenant_annual" as const;
const TERM_MONTHS = 12;

function addMonths(from: Date, months: number) {
  const to = new Date(from);
  to.setMonth(to.getMonth() + months);
  return to;
}

export interface MembershipState {
  active: boolean;
  endsAt?: string;
  /** A checkout that has been started but not confirmed. */
  pending?: Subscription;
}

/**
 * The current membership for an account, derived from the rows rather than
 * cached anywhere. `is_active` on its own is not trusted — an expiry that has
 * passed is not a membership, whatever the column says.
 */
export async function getMembership(accountId: string): Promise<MembershipState> {
  const rows = await listSubscriptions(accountId);
  const nowIso = new Date().toISOString();

  const active = rows.find(
    (row) => row.status === "active" && row.endsAt !== undefined && row.endsAt > nowIso,
  );
  if (active) return { active: true, endsAt: active.endsAt };

  const pending = rows.find((row) => row.status === "pending");
  return { active: false, pending };
}

export async function isActiveMember(accountId: string): Promise<boolean> {
  return (await getMembership(accountId)).active;
}

export interface CheckoutRequest {
  accountId: string;
  /** The mobile-money number to charge. */
  phone: string;
  /** Where the confirmation should return the tenant. */
  returnTo?: string;
}

export interface CheckoutResult {
  subscription: Subscription;
  amount: number;
  paymentReference: string;
  /** Present when the provider hands back a hosted page or a USSD push id. */
  checkoutUrl?: string;
  /** False when no provider is configured — the payment cannot complete. */
  providerConfigured: boolean;
}

function paymentsConfigured() {
  return Boolean(process.env.PAYMENTS_PROVIDER && process.env.PAYMENTS_API_KEY);
}

/**
 * Start a payment. Creates the `pending` row and asks the provider to push a
 * prompt to the tenant's phone. It deliberately returns no entitlement: the
 * caller learns nothing about access from this, only that a payment is in
 * flight.
 */
export async function startCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const existing = await getMembership(request.accountId);
  if (existing.pending) {
    return {
      subscription: existing.pending,
      amount: TENANT_ANNUAL_PRICE_TZS,
      paymentReference: existing.pending.paymentReference,
      providerConfigured: paymentsConfigured(),
    };
  }

  const paymentReference = `KAA-SUB-${randomUUID().slice(0, 8).toUpperCase()}`;

  const subscription = await createSubscription({
    accountId: request.accountId,
    plan: TENANT_PLAN,
    amount: TENANT_ANNUAL_PRICE_TZS,
    status: "pending",
    paymentReference,
  });

  let checkoutUrl: string | undefined;
  if (paymentsConfigured()) {
    checkoutUrl = await requestProviderCharge(request, paymentReference);
  }

  return {
    subscription,
    amount: TENANT_ANNUAL_PRICE_TZS,
    paymentReference,
    checkoutUrl,
    providerConfigured: paymentsConfigured(),
  };
}

/**
 * Selcom and Azampay both aggregate M-Pesa, Tigo Pesa, Airtel Money and
 * Halopesa behind one push-to-phone call. The shapes differ; the reference we
 * send is ours and comes back on the webhook, which is what makes the
 * confirmation matchable.
 */
async function requestProviderCharge(request: CheckoutRequest, reference: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${process.env.PAYMENTS_API_BASE_URL ?? process.env.PAYMENTS_PROVIDER}/charges`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.PAYMENTS_API_KEY}` },
      body: JSON.stringify({
        amount: TENANT_ANNUAL_PRICE_TZS,
        currency: "TZS",
        reference,
        msisdn: request.phone,
        description: "Kaa membership, 12 months",
        redirect_url: request.returnTo,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { checkout_url?: string; redirect_url?: string };
    return payload.checkout_url ?? payload.redirect_url;
  } catch {
    return undefined;
  }
}

export type ConfirmationResult =
  | { ok: true; subscription: Subscription; alreadyProcessed: boolean }
  | { ok: false; reason: "unknown_reference" | "not_pending" };

/**
 * The only thing that grants access. Called from the provider webhook after
 * the signature has been checked, never from a client.
 */
export async function confirmPayment(
  paymentReference: string,
  providerReference?: string,
): Promise<ConfirmationResult> {
  const subscription = await findSubscriptionByPaymentReference(paymentReference);
  if (!subscription) return { ok: false, reason: "unknown_reference" };

  // A provider retrying a callback it already delivered must not buy the
  // tenant a second year.
  if (subscription.status === "active") {
    return { ok: true, subscription, alreadyProcessed: true };
  }
  if (subscription.status !== "pending") return { ok: false, reason: "not_pending" };

  const startsAt = new Date();
  const updated = await updateSubscription(subscription.id, {
    status: "active",
    startsAt: startsAt.toISOString(),
    endsAt: addMonths(startsAt, TERM_MONTHS).toISOString(),
    providerReference,
  });

  return { ok: true, subscription: updated!, alreadyProcessed: false };
}

/** A payment the provider reports as failed. Access is untouched — it was never granted. */
export async function failPayment(paymentReference: string): Promise<void> {
  const subscription = await findSubscriptionByPaymentReference(paymentReference);
  if (subscription && subscription.status === "pending") {
    await updateSubscription(subscription.id, { status: "failed" });
  }
}
