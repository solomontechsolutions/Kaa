import { describe, expect, it } from "vitest";

import {
  extractAmenities,
  extractBedrooms,
  extractLocation,
  parseCriteria,
  parseMoney,
  refineCriteria,
} from "@/lib/search/criteria";

const PLACES = ["Mikocheni", "Mbezi", "Masaki", "Sinza", "Kariakoo", "Kinondoni", "Ubungo"];

describe("money normalisation", () => {
  it("reads the shorthands people actually type", () => {
    expect(parseMoney("500k")).toBe(500_000);
    expect(parseMoney("750K")).toBe(750_000);
    expect(parseMoney("2m")).toBe(2_000_000);
    expect(parseMoney("1.5m")).toBe(1_500_000);
    expect(parseMoney("700,000")).toBe(700_000);
    expect(parseMoney("700000")).toBe(700_000);
  });

  it("reads words, in English and Swahili", () => {
    expect(parseMoney("half a million")).toBe(500_000);
    expect(parseMoney("two million")).toBe(2_000_000);
    expect(parseMoney("milioni 2")).toBe(2_000_000);
    expect(parseMoney("elfu 500")).toBe(500_000);
  });

  it("treats a bare small number as thousands, because nothing rents for TZS 500", () => {
    expect(parseMoney("500")).toBe(500_000);
    expect(parseMoney("450")).toBe(450_000);
  });
});

describe("bedrooms", () => {
  it("reads digits either side of the word", () => {
    expect(extractBedrooms("2 bedroom in Mikocheni")).toBe(2);
    expect(extractBedrooms("vyumba 3 Sinza")).toBe(3);
    expect(extractBedrooms("3br")).toBe(3);
  });

  it("reads number words in all three languages", () => {
    expect(extractBedrooms("two bedrooms")).toBe(2);
    expect(extractBedrooms("vyumba viwili")).toBe(2);
    expect(extractBedrooms("ibyumba bibiri")).toBe(2);
  });
});

describe("amenities", () => {
  it("maps everyday phrasing onto Kaa's slugs", () => {
    expect(extractAmenities("I need parking and security")).toEqual(
      expect.arrayContaining(["parking", "security"]),
    );
    expect(extractAmenities("reliable water")).toContain("water_tank");
    expect(extractAmenities("constant water")).toContain("water_tank");
    expect(extractAmenities("secure place")).toContain("security");
    expect(extractAmenities("nataka maegesho na ulinzi")).toEqual(
      expect.arrayContaining(["parking", "security"]),
    );
  });

  it("does not fire on a substring", () => {
    // "ac" inside "back", the classic false positive.
    expect(extractAmenities("round the back of the plot")).not.toContain("aircon");
  });
});

describe("location", () => {
  it("only recognises places Kaa actually covers", () => {
    expect(extractLocation("something in Mikocheni", PLACES)).toBe("Mikocheni");
    expect(extractLocation("somewhere in Arusha", PLACES)).toBeUndefined();
  });
});

describe("whole messages", () => {
  it("extracts the example from the brief", () => {
    const criteria = parseCriteria("I need a 2 bedroom in Mikocheni under 700k with parking", PLACES);
    expect(criteria.bedrooms).toBe(2);
    expect(criteria.location).toBe("Mikocheni");
    expect(criteria.maxRent).toBe(700_000);
    expect(criteria.amenities).toContain("parking");
  });

  it("extracts the Masaki example", () => {
    const criteria = parseCriteria(
      "3 bedroom around Masaki, not more than 2 million, parking and security",
      PLACES,
    );
    expect(criteria).toMatchObject({ location: "Masaki", bedrooms: 3, maxRent: 2_000_000 });
    expect(criteria.amenities.sort()).toEqual(["parking", "security"]);
  });

  it("does not mistake the bedroom count for a budget", () => {
    const criteria = parseCriteria("2 bedroom Mbezi under 500k", PLACES);
    expect(criteria.bedrooms).toBe(2);
    expect(criteria.maxRent).toBe(500_000);
  });

  it("treats an unqualified budget as a ceiling", () => {
    expect(parseCriteria("budget 450k Kariakoo", PLACES).maxRent).toBe(450_000);
  });

  it("reads a floor when the tenant states one", () => {
    expect(parseCriteria("something from 800k upwards in Masaki", PLACES).minRent).toBe(800_000);
  });

  it("works in Swahili", () => {
    const criteria = parseCriteria("Natafuta vyumba viwili Sinza chini ya elfu 600", PLACES);
    expect(criteria.bedrooms).toBe(2);
    expect(criteria.location).toBe("Sinza");
    expect(criteria.maxRent).toBe(600_000);
  });
});

describe("refinement", () => {
  const base = parseCriteria("2 bedroom Mikocheni under 700k", PLACES);

  it("adds a requirement without losing the rest", () => {
    const next = refineCriteria(base, "only show me ones with parking", PLACES);
    expect(next).toMatchObject({ location: "Mikocheni", bedrooms: 2, maxRent: 700_000 });
    expect(next.amenities).toContain("parking");
  });

  it("replaces the budget", () => {
    const next = refineCriteria(base, "actually increase the budget to 800k", PLACES);
    expect(next.maxRent).toBe(800_000);
    expect(next.location).toBe("Mikocheni");
  });

  it("replaces the location", () => {
    const next = refineCriteria(base, "forget Mikocheni, try Sinza", PLACES);
    expect(next.location).toBe("Sinza");
    expect(next.bedrooms).toBe(2);
  });

  it("drops a requirement when asked to", () => {
    const withParking = refineCriteria(base, "with parking", PLACES);
    const without = refineCriteria(withParking, "without parking", PLACES);
    expect(without.amenities).not.toContain("parking");
  });
});
