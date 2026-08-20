import { beforeEach, describe, expect, it } from "vitest";

import { createAccount, __resetStore } from "@/lib/accounts/store";
import {
  TENANT_ANNUAL_PRICE_TZS,
  confirmPayment,
  failPayment,
  getMembership,
  isActiveMember,
  startCheckout,
} from "@/lib/subscription/service";
import { entitlementForAccount } from "@/lib/access/session";

async function tenant() {
  return createAccount({
    nidaStatus: "verified",
    nidaVerifiedAt: new Date().toISOString(),
    phone: "+255784000500",
    phoneVerifiedAt: new Date().toISOString(),
    preferredLanguage: "sw",
  });
}

beforeEach(() => {
  __resetStore();
});

describe("the price", () => {
  it("is TZS 10,000", () => {
    expect(TENANT_ANNUAL_PRICE_TZS).toBe(10_000);
  });
});

describe("membership state machine", () => {
  it("starts inactive", async () => {
    const account = await tenant();
    expect(await isActiveMember(account.id)).toBe(false);
  });

  it("does not activate on checkout — initiating a payment grants nothing", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });

    expect(checkout.subscription.status).toBe("pending");
    expect(await isActiveMember(account.id)).toBe(false);
    expect((await entitlementForAccount(account.id)).level).toBe("free");
  });

  it("activates only when the provider confirms", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });

    const result = await confirmPayment(checkout.paymentReference, "PROVIDER-1");
    expect(result.ok).toBe(true);
    expect(await isActiveMember(account.id)).toBe(true);
    expect((await entitlementForAccount(account.id)).level).toBe("member");
  });

  it("grants twelve months", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });
    await confirmPayment(checkout.paymentReference);

    const membership = await getMembership(account.id);
    const months =
      (new Date(membership.endsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4);
    expect(months).toBeGreaterThan(11.5);
    expect(months).toBeLessThan(12.5);
  });

  it("is idempotent — a retried callback does not buy a second year", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });

    await confirmPayment(checkout.paymentReference, "PROVIDER-1");
    const first = (await getMembership(account.id)).endsAt;

    const second = await confirmPayment(checkout.paymentReference, "PROVIDER-1");
    expect(second).toMatchObject({ ok: true, alreadyProcessed: true });
    expect((await getMembership(account.id)).endsAt).toBe(first);
  });

  it("refuses a reference it never issued", async () => {
    expect(await confirmPayment("KAA-SUB-MADEUP")).toMatchObject({
      ok: false,
      reason: "unknown_reference",
    });
  });

  it("leaves access untouched when a payment fails", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });

    await failPayment(checkout.paymentReference);
    expect(await isActiveMember(account.id)).toBe(false);

    // And a failed payment cannot then be confirmed.
    expect(await confirmPayment(checkout.paymentReference)).toMatchObject({ ok: false });
  });

  it("treats an expired membership as no membership, whatever the row says", async () => {
    const account = await tenant();
    const checkout = await startCheckout({ accountId: account.id, phone: account.phone! });
    await confirmPayment(checkout.paymentReference);

    const { updateSubscription } = await import("@/lib/accounts/store");
    await updateSubscription(checkout.subscription.id, {
      endsAt: new Date(Date.now() - 1000).toISOString(),
    });

    expect(await isActiveMember(account.id)).toBe(false);
    expect((await entitlementForAccount(account.id)).level).toBe("free");
  });

  it("does not start a second checkout while one is outstanding", async () => {
    const account = await tenant();
    const first = await startCheckout({ accountId: account.id, phone: account.phone! });
    const second = await startCheckout({ accountId: account.id, phone: account.phone! });
    expect(second.paymentReference).toBe(first.paymentReference);
  });
});

describe("entitlement", () => {
  it("is free, not member, for a verified account that has not paid", async () => {
    const account = await tenant();
    const entitlement = await entitlementForAccount(account.id);
    expect(entitlement).toMatchObject({ level: "free", verified: true });
  });

  it("is anonymous for an account that does not exist", async () => {
    expect((await entitlementForAccount("nobody")).level).toBe("anonymous");
  });

  it("reports an unverified account as free but not verified", async () => {
    const account = await createAccount({ nidaStatus: "unverified", preferredLanguage: "sw" });
    expect(await entitlementForAccount(account.id)).toMatchObject({ level: "free", verified: false });
  });
});
