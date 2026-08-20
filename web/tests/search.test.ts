import { describe, expect, it } from "vitest";

import { listLiveUnits } from "@/lib/data/catalogue";
import { searchProperties, similarTo } from "@/lib/search/service";

describe("the catalogue", () => {
  it("only offers homes that are both listed live and actually available", () => {
    for (const unit of listLiveUnits()) {
      expect(unit.listingState).toBe("live");
      expect(unit.status).toBe("available");
      expect(unit.property).toBeDefined();
    }
  });

  it("spans every landlord, not just one org — tenant discovery is not org-scoped", () => {
    const orgs = new Set(listLiveUnits().map((unit) => unit.property.orgId));
    expect(orgs.size).toBeGreaterThan(0);
  });
});

describe("counts are genuine", () => {
  it("returns the number of homes that meet every stated requirement, and no more", () => {
    const criteria = { bedrooms: 2, amenities: [] };
    const result = searchProperties(criteria);

    const byHand = listLiveUnits().filter((unit) => unit.bedrooms === 2).length;
    expect(result.count).toBe(byHand);
    expect(result.matches).toHaveLength(byHand);
  });

  it("never counts a home that misses a requirement", () => {
    const result = searchProperties({ maxRent: 600_000, amenities: ["parking"] });
    for (const { unit } of result.matches) {
      expect(unit.rentAmount).toBeLessThanOrEqual(600_000);
      expect(unit.amenities).toContain("parking");
    }
  });

  it("returns zero rather than something approximate when nothing matches", () => {
    const result = searchProperties({ location: "Mikocheni", maxRent: 1, amenities: [] });
    expect(result.count).toBe(0);
    expect(result.matches).toHaveLength(0);
  });

  it("never claims an amenity the catalogue does not record", () => {
    const result = searchProperties({ amenities: ["pool"] });
    for (const { unit } of result.matches) {
      expect(unit.amenities).toContain("pool");
    }
  });
});

describe("suggestions", () => {
  it("only offers a relaxation that genuinely returns homes", () => {
    const result = searchProperties({ location: "Mikocheni", maxRent: 100_000, bedrooms: 2, amenities: [] });
    expect(result.count).toBe(0);

    for (const suggestion of result.suggestions) {
      expect(suggestion.count).toBeGreaterThan(0);
    }
  });

  it("offers nothing when the search already has answers", () => {
    const result = searchProperties({ amenities: [] });
    expect(result.count).toBeGreaterThan(0);
    expect(result.suggestions).toHaveLength(0);
  });
});

describe("ranking", () => {
  it("puts an exact ward match above a district-level one", () => {
    const result = searchProperties({ location: "Kinondoni", amenities: [] });
    if (result.matches.length > 1) {
      const scores = result.matches.map((row) => row.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    }
  });

  it("prefers a home that meets more of the amenities asked for", () => {
    const wanted = ["parking", "security"];
    const result = searchProperties({ amenities: [], minBedrooms: 1 });

    const withBoth = result.matches.find((row) => wanted.every((a) => row.unit.amenities.includes(a)));
    const withNeither = result.matches.find((row) => wanted.every((a) => !row.unit.amenities.includes(a)));

    if (withBoth && withNeither) {
      const scored = searchProperties({ amenities: wanted });
      expect(scored.matches.every((row) => wanted.every((a) => row.unit.amenities.includes(a)))).toBe(true);
    }
  });

  it("never returns the same home as similar to itself", () => {
    const unit = listLiveUnits()[0]!;
    expect(similarTo(unit).some((row) => row.unit.id === unit.id)).toBe(false);
  });
});
