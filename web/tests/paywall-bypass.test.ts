import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Attempts to get at member-only data without paying.
 *
 * These call the route handlers directly, which is the point — they are the
 * same entry a curl command, a modified frontend or a replayed request would
 * hit. If the paywall lived in the UI, every one of these would pass.
 */

let sessionCookie: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "kaa_session" && sessionCookie ? { value: sessionCookie } : undefined),
    getAll: () => [],
    set: () => {},
  }),
  headers: async () => new Headers(),
}));

const { __resetStore, createAccount, listSaved } = await import("@/lib/accounts/store");
const { issueToken } = await import("@/lib/accounts/session");
const { confirmPayment, startCheckout } = await import("@/lib/subscription/service");
const { listLiveUnits } = await import("@/lib/data/catalogue");

const search = (await import("@/app/api/search/route")).POST;
const listing = (await import("@/app/api/listings/[id]/route")).GET;
const saved = await import("@/app/api/saved/route");
const viewings = (await import("@/app/api/viewings/route")).POST;
const checkout = (await import("@/app/api/subscription/checkout/route")).POST;

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function signInAsFreeTenant() {
  const account = await createAccount({
    nidaStatus: "verified",
    nidaVerifiedAt: new Date().toISOString(),
    phone: "+255784000500",
    phoneVerifiedAt: new Date().toISOString(),
    preferredLanguage: "en",
  });
  sessionCookie = issueToken(account.id);
  return account;
}

async function signInAsMember() {
  const account = await signInAsFreeTenant();
  const started = await startCheckout({ accountId: account.id, phone: account.phone! });
  await confirmPayment(started.paymentReference, "PROVIDER-1");
  return account;
}

beforeEach(() => {
  __resetStore();
  sessionCookie = undefined;
});

describe("calling the API directly", () => {
  it("gives an anonymous caller a genuine count and nothing else", async () => {
    const response = await search(post("http://kaa.test/api/search", { bedrooms: 2 }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.count).toBeGreaterThanOrEqual(0);
    expect(payload.access).toBe("anonymous");
    expect(payload.results.every((row: { access: string }) => row.access === "preview")).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("photosLocked\":false");
  });

  it("does not hand a free caller a full listing however the request is shaped", async () => {
    await signInAsFreeTenant();

    for (const body of [
      { bedrooms: 2 },
      { bedrooms: 2, access: "member" },
      { bedrooms: 2, entitlement: "member", isMember: true },
      { bedrooms: 2, limit: 50 },
    ]) {
      const response = await search(post("http://kaa.test/api/search", body));
      const payload = await response.json();
      expect(payload.access).toBe("free");
      expect(payload.results.every((row: { access: string }) => row.access === "preview")).toBe(true);
    }
  });

  it("ignores a forged header claiming membership", async () => {
    await signInAsFreeTenant();
    const response = await search(
      post("http://kaa.test/api/search", { bedrooms: 2 }, { "x-kaa-member": "true", authorization: "Bearer member" }),
    );
    expect((await response.json()).access).toBe("free");
  });

  it("refuses a free caller the full listing endpoint", async () => {
    await signInAsFreeTenant();
    const unit = listLiveUnits()[0]!;

    const response = await listing(new Request(`http://kaa.test/api/listings/${unit.id}`), {
      params: Promise.resolve({ id: unit.id }),
    });
    const payload = await response.json();

    expect(payload.property.access).toBe("preview");
    const body = JSON.stringify(payload);
    expect(body).not.toContain(unit.property.name);
    expect(body).not.toContain(unit.property.addressLine);
    expect(body).not.toContain(String(unit.property.latitude));
  });

  it("answers 402 rather than saving for a free caller", async () => {
    const account = await signInAsFreeTenant();
    const unit = listLiveUnits()[0]!;

    const response = await saved.POST(post("http://kaa.test/api/saved", { unitId: unit.id }));
    expect(response.status).toBe(402);
    expect((await response.json()).error).toBe("membership_required");
    expect(await listSaved(account.id)).toHaveLength(0);
  });

  it("answers 402 rather than listing saves for a free caller", async () => {
    await signInAsFreeTenant();
    expect((await saved.GET()).status).toBe(402);
  });

  it("answers 402 rather than booking a viewing for a free caller", async () => {
    await signInAsFreeTenant();
    const unit = listLiveUnits()[0]!;
    const response = await viewings(post("http://kaa.test/api/viewings", { unitId: unit.id }));
    expect(response.status).toBe(402);
  });

  it("answers 401, not 402, when there is no account at all", async () => {
    const unit = listLiveUnits()[0]!;
    expect((await saved.POST(post("http://kaa.test/api/saved", { unitId: unit.id }))).status).toBe(401);
  });

  it("does not grant membership from the checkout endpoint", async () => {
    await signInAsFreeTenant();

    const response = await checkout(post("http://kaa.test/api/subscription/checkout", { phone: "+255784000500" }));
    expect((await response.json()).status).toBe("pending");

    // Straight back to the gated endpoint: still refused.
    const unit = listLiveUnits()[0]!;
    expect((await saved.POST(post("http://kaa.test/api/saved", { unitId: unit.id }))).status).toBe(402);
  });

  it("refuses checkout for an account that has not verified", async () => {
    const account = await createAccount({ nidaStatus: "unverified", preferredLanguage: "sw" });
    sessionCookie = issueToken(account.id);

    const response = await checkout(post("http://kaa.test/api/subscription/checkout", { phone: "+255784000500" }));
    expect(response.status).toBe(403);
  });

  it("ignores a session cookie that was tampered with", async () => {
    await signInAsMember();
    sessionCookie = `${sessionCookie!.split(".")[0]}.forgedsignature`;

    const response = await search(post("http://kaa.test/api/search", { bedrooms: 2 }));
    expect((await response.json()).access).toBe("anonymous");
  });
});

describe("once the payment is confirmed", () => {
  it("opens everything, on the same session", async () => {
    await signInAsMember();
    const unit = listLiveUnits()[0]!;

    const searchResponse = await search(post("http://kaa.test/api/search", { bedrooms: unit.bedrooms }));
    const searchPayload = await searchResponse.json();
    expect(searchPayload.access).toBe("member");
    expect(searchPayload.results.every((row: { access: string }) => row.access === "full")).toBe(true);

    const listingResponse = await listing(new Request(`http://kaa.test/api/listings/${unit.id}`), {
      params: Promise.resolve({ id: unit.id }),
    });
    expect((await listingResponse.json()).property.access).toBe("full");

    expect((await saved.POST(post("http://kaa.test/api/saved", { unitId: unit.id }))).status).toBe(200);
    expect((await viewings(post("http://kaa.test/api/viewings", { unitId: unit.id }))).status).toBe(200);
  });

  it("gives free and paid callers the same count — only the payload differs", async () => {
    await signInAsFreeTenant();
    const free = await (await search(post("http://kaa.test/api/search", { bedrooms: 2 }))).json();

    __resetStore();
    await signInAsMember();
    const member = await (await search(post("http://kaa.test/api/search", { bedrooms: 2 }))).json();

    expect(free.count).toBe(member.count);
  });
});
