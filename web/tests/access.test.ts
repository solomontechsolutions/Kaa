import { describe, expect, it } from "vitest";

import { PROTECTED_OPERATIONS, PaywallError, assertCan, can } from "@/lib/access/entitlement";
import { toMemberView, toPreview, viewFor, viewsFor } from "@/lib/access/redact";
import { listLiveUnits } from "@/lib/data/catalogue";

const unit = listLiveUnits()[0]!;

const ANON = { level: "anonymous" as const, verified: false };
const FREE = { level: "free" as const, accountId: "acc-1", verified: true };
const MEMBER = { level: "member" as const, accountId: "acc-2", verified: true };

describe("protected operations", () => {
  it("refuses every one of them without an active membership", () => {
    for (const operation of PROTECTED_OPERATIONS) {
      expect(can(ANON, operation)).toBe(false);
      expect(can(FREE, operation)).toBe(false);
      expect(can(MEMBER, operation)).toBe(true);
    }
  });

  it("throws a 402 rather than returning a falsy value that could be ignored", () => {
    expect(() => assertCan(FREE, "save_property")).toThrowError(PaywallError);
    expect(() => assertCan(MEMBER, "save_property")).not.toThrow();
  });
});

describe("the redaction boundary", () => {
  it("gives a free user an object with no way to identify the building", () => {
    const preview = toPreview(unit);
    const serialised = JSON.stringify(preview);

    // Nothing that would let a tenant find the landlord without paying.
    expect(serialised).not.toContain(unit.property.name);
    expect(serialised).not.toContain(unit.property.addressLine);
    expect(serialised).not.toContain(String(unit.property.latitude));
    expect(serialised).not.toContain(String(unit.property.longitude));
    if (unit.property.caretakerPhone) {
      expect(serialised).not.toContain(unit.property.caretakerPhone);
    }

    // And no photos at all — not blurred, absent.
    expect(preview.photosLocked).toBe(true);
    expect(serialised).not.toContain("images");
  });

  it("keeps the preview price honest but coarse", () => {
    const preview = toPreview(unit);
    expect(preview.rentFrom).toBeLessThanOrEqual(unit.rentAmount);
    expect(preview.rentFrom % 50_000).toBe(0);
  });

  it("tells a free user exactly what is locked rather than hiding that it exists", () => {
    expect(toPreview(unit).locked).toEqual(
      expect.arrayContaining(["photos", "landlord_details", "contact", "viewing", "full_location"]),
    );
  });

  it("counts amenities for a free user without naming them", () => {
    const preview = toPreview(unit);
    expect(preview.amenityCount).toBe(unit.amenities.length);
    for (const amenity of unit.amenities) {
      expect(JSON.stringify(preview)).not.toContain(amenity);
    }
  });

  it("gives a member the real listing", () => {
    const full = toMemberView(unit, { name: "Mwanga Estates", contactPhone: "+255700000000", isVerified: true });
    expect(full.access).toBe("full");
    expect(full.propertyName).toBe(unit.property.name);
    expect(full.addressLine).toBe(unit.property.addressLine);
    expect(full.managedBy.phone).toBe("+255700000000");
    expect(full.amenities.map((a) => a.slug).sort()).toEqual([...unit.amenities].sort());
    expect(full.moveInCost).toBe(unit.rentAmount * (unit.advanceMonths + unit.depositMonths));
  });

  it("routes entitlement to shape, so the wrong body cannot be produced by accident", () => {
    expect(viewFor(unit, ANON).access).toBe("preview");
    expect(viewFor(unit, FREE).access).toBe("preview");
    expect(viewFor(unit, MEMBER).access).toBe("full");

    const many = viewsFor(listLiveUnits(), FREE);
    expect(many.every((view) => view.access === "preview")).toBe(true);
  });
});
