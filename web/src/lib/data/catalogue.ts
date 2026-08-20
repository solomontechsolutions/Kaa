/**
 * The Kaa property catalogue — the tenant-facing read model.
 *
 * `queries.ts` is org-scoped: it answers "what does *this landlord* own",
 * which is the Operators question. Tenant discovery is the opposite question,
 * "what is available *anywhere on Kaa*", so it needs its own entry point.
 *
 * This module is the one place every tenant-facing surface reads listings
 * from. Web, mobile and WhatsApp all land here. There is no second catalogue.
 */

import { amenityLabels, properties, units, wards } from "./seed";
import type { UnitWithProperty } from "@/lib/types";

const propertyById = new Map(properties.map((property) => [property.id, property]));

/**
 * Every unit a tenant is allowed to discover: listed live, and actually
 * lettable. A unit that is `reserved` or `occupied` is not inventory, however
 * its listing state reads.
 */
export function listLiveUnits(): UnitWithProperty[] {
  return units
    .filter((unit) => unit.listingState === "live" && unit.status === "available")
    .map((unit) => ({ ...unit, property: propertyById.get(unit.propertyId)! }))
    .filter((unit) => Boolean(unit.property));
}

export function getLiveUnit(id: string): UnitWithProperty | undefined {
  return listLiveUnits().find((unit) => unit.id === id);
}

/** Wards that currently have something in them, for chips and suggestions. */
export function activeWards(): string[] {
  return [...new Set(listLiveUnits().map((unit) => unit.property.ward))].sort();
}

export function activeDistricts(): string[] {
  return [...new Set(listLiveUnits().map((unit) => unit.property.district))].sort();
}

/**
 * Every place name the parser may recognise.
 *
 * Deliberately the whole coverage area rather than only wards that currently
 * have inventory: a tenant asking about Kariakoo should be told there are no
 * matches there, not asked which area they meant.
 */
export function knownPlaces(): string[] {
  return [...new Set([...wards.map((ward) => ward.name), ...wards.map((ward) => ward.district)])];
}

/** Wards in the same district — what "search nearby" actually means here. */
export function neighbouringWards(ward: string): string[] {
  const match = wards.find((w) => w.name.toLowerCase() === ward.toLowerCase());
  if (!match) return [];
  return wards
    .filter((w) => w.districtId === match.districtId && w.id !== match.id)
    .map((w) => w.name);
}

export { amenityLabels, wards };
