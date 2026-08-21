import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies the correct password", () => {
    const hash = hashPassword("KaaOperator@2026");
    expect(verifyPassword("KaaOperator@2026", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = hashPassword("KaaOperator@2026");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("never stores the password itself", () => {
    const hash = hashPassword("KaaOperator@2026");
    expect(hash).not.toContain("KaaOperator@2026");
  });

  it("salts each hash differently, even for the same password", () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    expect(verifyPassword("same-password", a)).toBe(true);
    expect(verifyPassword("same-password", b)).toBe(true);
  });

  it("rejects a missing or malformed stored hash rather than throwing", () => {
    expect(verifyPassword("anything", undefined)).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(verifyPassword("anything", "zz:zz")).toBe(false);
  });
});
