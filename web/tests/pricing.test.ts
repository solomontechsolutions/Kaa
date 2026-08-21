import { describe, expect, it } from "vitest";

import {
  KAA_RENTAL_SERVICE_RATE,
  LANDLORD_KAA_CHARGE_TZS,
  kaaServiceCharge,
  rentBreakdown,
} from "@/lib/pricing/service-charge";

describe("Kaa's rental service charge", () => {
  it("is 10% today, and lives in exactly one place", () => {
    expect(KAA_RENTAL_SERVICE_RATE).toBe(0.1);
  });

  it("charges the landlord nothing", () => {
    expect(LANDLORD_KAA_CHARGE_TZS).toBe(0);
  });

  it("computes 30,000 on a 300,000 rent", () => {
    expect(kaaServiceCharge(300_000)).toBe(30_000);
  });

  it("computes the full breakdown: rent, charge and total kept separate", () => {
    expect(rentBreakdown(300_000)).toEqual({
      baseRent: 300_000,
      kaaServiceRate: 0.1,
      kaaServiceCharge: 30_000,
      tenantTotal: 330_000,
    });
  });

  it("scales with rent — different properties, different charges", () => {
    expect(rentBreakdown(600_000).kaaServiceCharge).toBe(60_000);
    expect(rentBreakdown(600_000).tenantTotal).toBe(660_000);
    expect(rentBreakdown(1_000_000).kaaServiceCharge).toBe(100_000);
    expect(rentBreakdown(1_000_000).tenantTotal).toBe(1_100_000);
  });

  it("recalculates dynamically when the landlord changes rent, never hard-coded", () => {
    const before = rentBreakdown(300_000);
    expect(before.tenantTotal).toBe(330_000);

    const after = rentBreakdown(350_000);
    expect(after.kaaServiceCharge).toBe(35_000);
    expect(after.tenantTotal).toBe(385_000);
  });

  it("never mixes the rate into the stored rent — baseRent is untouched", () => {
    const breakdown = rentBreakdown(300_000);
    expect(breakdown.baseRent).toBe(300_000);
    expect(breakdown.baseRent).not.toBe(breakdown.tenantTotal);
  });

  it("supports a configurable rate without touching call sites", () => {
    expect(kaaServiceCharge(300_000, 0.05)).toBe(15_000);
  });

  it("rounds to whole shillings", () => {
    expect(kaaServiceCharge(333_333)).toBe(Math.round(333_333 * 0.1));
  });
});
