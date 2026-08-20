/**
 * Kaa property search — the one search every surface uses.
 *
 * Web, mobile and WhatsApp all call `searchProperties`. There is no second
 * implementation anywhere; the WhatsApp layer is a transport, not a search
 * engine. The count this returns is the genuine number of matching available
 * homes in the catalogue, and it is the number free users are shown. Nothing
 * inflates it.
 */

import { listLiveUnits, neighbouringWards } from "@/lib/data/catalogue";
import type { UnitWithProperty } from "@/lib/types";
import type { SearchCriteria } from "./criteria";

export interface ScoredUnit {
  unit: UnitWithProperty;
  score: number;
  /** Which requirements this home actually meets, for honest explanation. */
  matched: string[];
  /** Requirements it misses, empty for a full match. */
  missed: string[];
}

export interface SearchResult {
  /** Homes meeting every stated requirement. This is the number shown. */
  count: number;
  matches: ScoredUnit[];
  /** Near misses, only ever surfaced as "close to what you asked for". */
  nearMisses: ScoredUnit[];
  criteria: SearchCriteria;
  /** Concrete next moves when the count is zero. Never invented. */
  suggestions: Suggestion[];
}

export type Suggestion =
  | { kind: "raise_budget"; toAmount: number; count: number }
  | { kind: "nearby_ward"; ward: string; count: number }
  | { kind: "drop_amenity"; amenity: string; count: number }
  | { kind: "any_bedrooms"; count: number };

// ── Matching ───────────────────────────────────────────────────────────

function placeMatches(unit: UnitWithProperty, location: string) {
  const needle = location.toLowerCase();
  return (
    unit.property.ward.toLowerCase() === needle ||
    unit.property.district.toLowerCase() === needle ||
    unit.property.ward.toLowerCase().includes(needle) ||
    unit.property.name.toLowerCase().includes(needle)
  );
}

function evaluate(unit: UnitWithProperty, criteria: SearchCriteria) {
  const matched: string[] = [];
  const missed: string[] = [];

  if (criteria.location) {
    (placeMatches(unit, criteria.location) ? matched : missed).push("location");
  }
  if (criteria.bedrooms !== undefined) {
    (unit.bedrooms === criteria.bedrooms ? matched : missed).push("bedrooms");
  }
  if (criteria.minBedrooms !== undefined) {
    (unit.bedrooms >= criteria.minBedrooms ? matched : missed).push("minBedrooms");
  }
  if (criteria.maxRent !== undefined) {
    (unit.rentAmount <= criteria.maxRent ? matched : missed).push("maxRent");
  }
  if (criteria.minRent !== undefined) {
    (unit.rentAmount >= criteria.minRent ? matched : missed).push("minRent");
  }
  for (const amenity of criteria.amenities) {
    // If the catalogue does not record an amenity for this unit, the unit does
    // not have it. Kaa never claims a home has parking on a hunch.
    (unit.amenities.includes(amenity) ? matched : missed).push(`amenity:${amenity}`);
  }

  return { matched, missed };
}

/**
 * Ranking. Requirement satisfaction first, then the things that make one
 * qualifying home a better answer than another.
 */
function score(unit: UnitWithProperty, criteria: SearchCriteria, matched: string[]) {
  let value = 0;

  // Exact location beats a district-level match.
  if (criteria.location) {
    if (unit.property.ward.toLowerCase() === criteria.location.toLowerCase()) value += 40;
    else if (matched.includes("location")) value += 22;
  }

  if (criteria.bedrooms !== undefined && unit.bedrooms === criteria.bedrooms) value += 30;

  // Price proximity: sitting just under the ceiling is a better answer than
  // being far below it, which usually means a different class of home.
  if (criteria.maxRent !== undefined && unit.rentAmount <= criteria.maxRent) {
    const ratio = unit.rentAmount / criteria.maxRent;
    value += 10 + Math.round(ratio * 15);
  }

  value += criteria.amenities.filter((a) => unit.amenities.includes(a)).length * 8;

  // Availability: something ready now beats something ready in two months.
  if (!unit.availableFrom) value += 6;
  else {
    const days = (new Date(unit.availableFrom).getTime() - Date.now()) / 864e5;
    value += days <= 0 ? 6 : days <= 30 ? 4 : 1;
  }

  // Listing completeness and quality — a verified property with photos, a
  // description and a full amenity list is a better thing to send someone.
  if (unit.property.isVerified) value += 8;
  if (unit.images.length) value += Math.min(6, unit.images.length);
  if (unit.property.description) value += 2;
  if (unit.sizeSqm) value += 1;
  value += Math.min(4, unit.amenities.length / 2);

  // A gentler thumb on the scale: fewer months demanded upfront is the thing
  // tenants get ambushed with, so surface the kinder terms first.
  value += Math.max(0, 12 - unit.advanceMonths) / 2;

  return Math.round(value);
}

// ── Suggestions ────────────────────────────────────────────────────────

function countFor(criteria: SearchCriteria) {
  return listLiveUnits().filter((unit) => evaluate(unit, criteria).missed.length === 0).length;
}

/**
 * What would actually help, checked against the catalogue rather than guessed.
 * A suggestion is only offered when relaxing that one thing genuinely returns
 * homes.
 */
function buildSuggestions(criteria: SearchCriteria): Suggestion[] {
  const out: Suggestion[] = [];

  if (criteria.maxRent) {
    for (const multiplier of [1.15, 1.3, 1.5]) {
      const toAmount = Math.round((criteria.maxRent * multiplier) / 50_000) * 50_000;
      const count = countFor({ ...criteria, maxRent: toAmount });
      if (count > 0) {
        out.push({ kind: "raise_budget", toAmount, count });
        break;
      }
    }
  }

  if (criteria.location) {
    for (const ward of neighbouringWards(criteria.location)) {
      const count = countFor({ ...criteria, location: ward });
      if (count > 0) out.push({ kind: "nearby_ward", ward, count });
      if (out.filter((s) => s.kind === "nearby_ward").length >= 2) break;
    }
  }

  for (const amenity of criteria.amenities) {
    const count = countFor({ ...criteria, amenities: criteria.amenities.filter((a) => a !== amenity) });
    if (count > 0) {
      out.push({ kind: "drop_amenity", amenity, count });
      break;
    }
  }

  if (criteria.bedrooms !== undefined) {
    const count = countFor({ ...criteria, bedrooms: undefined });
    if (count > 0) out.push({ kind: "any_bedrooms", count });
  }

  return out;
}

// ── Entry point ────────────────────────────────────────────────────────

export function searchProperties(criteria: SearchCriteria): SearchResult {
  const scored = listLiveUnits().map((unit) => {
    const { matched, missed } = evaluate(unit, criteria);
    return { unit, matched, missed, score: score(unit, criteria, matched) };
  });

  const matches = scored
    .filter((row) => row.missed.length === 0)
    .sort((a, b) => b.score - a.score || a.unit.rentAmount - b.unit.rentAmount);

  const nearMisses = scored
    .filter((row) => row.missed.length === 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    count: matches.length,
    matches,
    nearMisses,
    criteria,
    suggestions: matches.length === 0 ? buildSuggestions(criteria) : [],
  };
}

/** Homes like this one, for "find similar". */
export function similarTo(unit: UnitWithProperty, limit = 5): ScoredUnit[] {
  const criteria: SearchCriteria = {
    location: unit.property.ward,
    bedrooms: unit.bedrooms,
    maxRent: Math.round(unit.rentAmount * 1.2),
    amenities: [],
  };
  return searchProperties(criteria)
    .matches.filter((row) => row.unit.id !== unit.id)
    .slice(0, limit);
}
