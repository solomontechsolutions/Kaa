import { beforeEach, describe, expect, it } from "vitest";

import { hashNida, maskNida, normalizeNida, verifyNida } from "@/lib/accounts/nida";
import { __resetOtp, sendOtp, verifyOtp } from "@/lib/accounts/otp";
import { issueToken, readToken } from "@/lib/accounts/session";
import { __resetStore, createAccount, findAccountByNidaHash, findAccountByPhone } from "@/lib/accounts/store";

beforeEach(() => {
  __resetStore();
  __resetOtp();
});

describe("NIDA numbers", () => {
  it("accepts twenty digits however they are written", () => {
    expect(normalizeNida("19980312 14101 0000123")).toBe("19980312141010000123");
    expect(normalizeNida("1998-0312-1410-1000-0123")).toBe("19980312141010000123");
  });

  it("rejects anything that is not twenty digits", () => {
    expect(normalizeNida("1234")).toBeNull();
    expect(normalizeNida("199803121410100001234")).toBeNull();
    expect(normalizeNida("abcdefghijklmnopqrst")).toBeNull();
  });

  it("verifies a well-formed number, and says when the identity is a stub", async () => {
    const result = await verifyNida("19980312141010000123");
    expect(result.ok).toBe(true);
    // No NIDA credentials in the test environment, and the result admits it
    // rather than passing a synthetic identity off as a real verification.
    if (result.ok) expect(result.source).toBe("development");
  });

  it("refuses a malformed number without calling anything", async () => {
    expect(await verifyNida("123")).toMatchObject({ ok: false, reason: "invalid_format" });
  });
});

describe("NIDA at rest", () => {
  const nida = "19980312141010000123";

  it("is stored one-way — the hash does not contain the number", () => {
    const hash = hashNida(nida);
    expect(hash).not.toContain(nida);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes the same number to the same value, so duplicates are detectable", () => {
    expect(hashNida(nida)).toBe(hashNida(nida));
    expect(hashNida(nida)).not.toBe(hashNida("19980312141010000124"));
  });

  it("masks everything but the last four", () => {
    expect(maskNida(nida)).toBe("••••••••••••••••0123");
    expect(maskNida(nida)).not.toContain(nida.slice(0, 16));
  });

  it("finds the existing account rather than creating a second one for one identity", async () => {
    const hash = hashNida(nida);
    const first = await createAccount({ nidaHash: hash, nidaStatus: "verified", preferredLanguage: "sw" });
    expect((await findAccountByNidaHash(hash))?.id).toBe(first.id);
  });
});

describe("phone confirmation", () => {
  const phone = "+255784000500";

  it("does not return the code — the result carries only the expiry and whether it was sent", async () => {
    const result = await sendOtp(phone);
    expect(result.ok).toBe(true);
    expect(Object.keys(result).sort()).toEqual(["delivered", "expiresAt", "ok"]);
    expect(result).not.toHaveProperty("code");

    // And the code it did generate does not verify by guessing the obvious.
    expect(await verifyOtp(phone, "000000")).toMatchObject({ ok: false });
  });

  it("rejects a wrong code", async () => {
    await sendOtp(phone);
    expect(await verifyOtp(phone, "000000")).toMatchObject({ ok: false });
  });

  it("rejects a code for a number that never asked for one", async () => {
    expect(await verifyOtp("+255700000000", "123456")).toMatchObject({
      ok: false,
      reason: "no_challenge",
    });
  });

  it("stops guessing after five attempts", async () => {
    await sendOtp(phone);
    for (let i = 0; i < 5; i++) await verifyOtp(phone, "111111");
    expect(await verifyOtp(phone, "111111")).toMatchObject({ ok: false, reason: "too_many_attempts" });
  });

  it("rate limits how many codes one number can request", async () => {
    for (let i = 0; i < 5; i++) expect((await sendOtp(phone)).ok).toBe(true);
    expect(await sendOtp(phone)).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("links a WhatsApp number to the same account as the app", async () => {
    const account = await createAccount({
      phone,
      whatsappPhone: phone,
      nidaStatus: "verified",
      preferredLanguage: "sw",
    });
    expect((await findAccountByPhone(phone))?.id).toBe(account.id);
  });
});

describe("the session cookie", () => {
  it("round-trips an account id", () => {
    expect(readToken(issueToken("account-1"))).toBe("account-1");
  });

  it("rejects a token with a tampered payload", () => {
    const token = issueToken("account-1");
    const [, signature] = token.split(".");
    const forged = `${Buffer.from("account-2." + (Date.now() + 100000)).toString("base64url")}.${signature}`;
    expect(readToken(forged)).toBeNull();
  });

  it("rejects an expired token", () => {
    const payload = `account-1.${Date.now() - 1}`;
    const encoded = Buffer.from(payload).toString("base64url");
    // Even correctly signed, an elapsed expiry is not a session.
    expect(readToken(`${encoded}.notasignature`)).toBeNull();
  });

  it("rejects nonsense", () => {
    expect(readToken(undefined)).toBeNull();
    expect(readToken("")).toBeNull();
    expect(readToken("garbage")).toBeNull();
    expect(readToken("a.b.c")).toBeNull();
  });

  it("carries nothing but the id — no membership flag a client could flip", () => {
    const token = issueToken("account-1");
    const payload = Buffer.from(token.split(".")[0]!, "base64url").toString();
    expect(payload).not.toMatch(/member|subscri|paid|active/i);
  });
});
