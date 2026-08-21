/**
 * The demo tenant — seeded so a reviewer can sign in as a returning member
 * immediately, without first running the full NIDA + OTP + checkout flow.
 *
 * Running that flow still works, and against this exact identity: the
 * account below is keyed by the hash of `DEMO_TENANT.nida`
 * (see `lib/accounts/nida.ts`, which recognises that number in development
 * and returns this same name), so typing it into the real sign-up form signs
 * back into this account rather than creating a new one.
 */

import { hashNida } from "./nida";
import { DEMO_TENANT } from "@/lib/demo/credentials";
import type { Account, Subscription } from "./types";

export const DEMO_TENANT_ACCOUNT_ID = "account-demo-tenant";
const DEMO_SUBSCRIPTION_ID = "sub-demo-tenant";

export function seedAccounts(): Account[] {
  const now = new Date();
  const createdAt = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: DEMO_TENANT_ACCOUNT_ID,
      nidaHash: hashNida(DEMO_TENANT.nida),
      nidaLast4: DEMO_TENANT.nida.slice(-4),
      nidaStatus: "verified",
      nidaVerifiedAt: createdAt,
      fullName: DEMO_TENANT.fullName,
      dateOfBirth: "1994-06-18",
      sex: "female",
      nationality: "Tanzanian",
      phone: DEMO_TENANT.phone,
      phoneVerifiedAt: createdAt,
      whatsappPhone: DEMO_TENANT.phone,
      activeLeaseId: "lse-demo",
      preferredLanguage: "sw",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

/** An already-active Kaa membership, so the demo tenant's paid experience is on from the first sign-in. */
export function seedSubscriptions(): Subscription[] {
  const now = new Date();
  const startsAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 335 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: DEMO_SUBSCRIPTION_ID,
      accountId: DEMO_TENANT_ACCOUNT_ID,
      plan: "tenant_annual",
      amount: 10_000,
      status: "active",
      startsAt,
      endsAt,
      paymentReference: "KAA-SUB-DEMO0001",
      providerReference: "DEMO-PROVIDER-REF",
      createdAt: startsAt,
      updatedAt: startsAt,
    },
  ];
}
