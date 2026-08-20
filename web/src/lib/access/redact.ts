/**
 * The redaction boundary.
 *
 * Free and paid users get *different objects*, not the same object with some
 * fields hidden by CSS. A free user's property view never contains a photo
 * path, a landlord's name, a phone number or a GPS coordinate, so there is
 * nothing to recover by opening the network tab, calling the API directly, or
 * editing the page in the console.
 *
 * This module is the only thing in Kaa that turns a `UnitWithProperty` into
 * something a response body may carry. If a new surface needs listings, it
 * comes through here.
 */

import { amenityLabels } from "@/lib/data/catalogue";
import type { Entitlement } from "./entitlement";
import { isMember } from "./entitlement";
import type { UnitWithProperty } from "@/lib/types";

/** What an unpaid user may know about a home. Deliberately not enough to find it. */
export interface PreviewProperty {
  id: string;
  access: "preview";
  /** "2 Bedroom Apartment" — a type, not a name. */
  headline: string;
  /** Ward only. Never the street, the building name or a coordinate. */
  ward: string;
  district: string;
  bedrooms: number;
  /** "From TZS 650,000" — the figure is real, the precision is coarse. */
  rentFrom: number;
  photosLocked: true;
  /** Count only. Which amenities is a paid detail. */
  amenityCount: number;
  locked: readonly string[];
}

/** The real listing. Only ever produced for an active member. */
export interface MemberProperty {
  id: string;
  access: "full";
  propertyName: string;
  label: string;
  headline: string;
  ward: string;
  district: string;
  addressLine: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  floor?: number;
  furnishing: string;
  rentAmount: number;
  depositMonths: number;
  advanceMonths: number;
  moveInCost: number;
  availableFrom?: string;
  amenities: { slug: string; en: string; sw: string }[];
  images: string[];
  photosLocked: false;
  managedBy: { name: string; phone?: string; isVerified: boolean };
  caretaker?: { name: string; phone: string };
  verified: boolean;
}

export type PropertyView = PreviewProperty | MemberProperty;

const LOCKED_ITEMS = [
  "photos",
  "full_details",
  "full_amenities",
  "landlord_details",
  "contact",
  "viewing",
  "full_location",
] as const;

function headlineFor(unit: UnitWithProperty) {
  const kind =
    unit.property.type === "house"
      ? "House"
      : unit.property.type === "standalone_room"
        ? "Room"
        : unit.property.type === "shared_house"
          ? "Shared house"
          : "Apartment";
  return `${unit.bedrooms} Bedroom ${kind}`;
}

/** Round down to the nearest 50,000 so the preview price is real but coarse. */
function coarseRent(amount: number) {
  return Math.floor(amount / 50_000) * 50_000 || amount;
}

export function toPreview(unit: UnitWithProperty): PreviewProperty {
  return {
    id: unit.id,
    access: "preview",
    headline: headlineFor(unit),
    ward: unit.property.ward,
    district: unit.property.district,
    bedrooms: unit.bedrooms,
    rentFrom: coarseRent(unit.rentAmount),
    photosLocked: true,
    amenityCount: unit.amenities.length,
    locked: LOCKED_ITEMS,
  };
}

export function toMemberView(unit: UnitWithProperty, org?: { name: string; contactPhone?: string; isVerified: boolean }): MemberProperty {
  return {
    id: unit.id,
    access: "full",
    propertyName: unit.property.name,
    label: unit.label,
    headline: headlineFor(unit),
    ward: unit.property.ward,
    district: unit.property.district,
    addressLine: unit.property.addressLine,
    landmark: unit.property.landmark,
    latitude: unit.property.latitude,
    longitude: unit.property.longitude,
    description: unit.property.description,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    sizeSqm: unit.sizeSqm,
    floor: unit.floor,
    furnishing: unit.furnishing,
    rentAmount: unit.rentAmount,
    depositMonths: unit.depositMonths,
    advanceMonths: unit.advanceMonths,
    moveInCost: unit.rentAmount * (unit.advanceMonths + unit.depositMonths),
    availableFrom: unit.availableFrom,
    amenities: unit.amenities.map((slug) => ({
      slug,
      en: amenityLabels[slug]?.en ?? slug,
      sw: amenityLabels[slug]?.sw ?? slug,
    })),
    images: unit.images,
    photosLocked: false,
    managedBy: {
      name: org?.name ?? "Managed by Kaa",
      phone: org?.contactPhone,
      isVerified: org?.isVerified ?? false,
    },
    caretaker:
      unit.property.caretakerName && unit.property.caretakerPhone
        ? { name: unit.property.caretakerName, phone: unit.property.caretakerPhone }
        : undefined,
    verified: unit.property.isVerified,
  };
}

/**
 * The function every response body goes through. Given an entitlement, you
 * cannot accidentally serialise the wrong shape.
 */
export function viewFor(
  unit: UnitWithProperty,
  entitlement: Entitlement,
  org?: { name: string; contactPhone?: string; isVerified: boolean },
): PropertyView {
  return isMember(entitlement) ? toMemberView(unit, org) : toPreview(unit);
}

export function viewsFor(
  units: UnitWithProperty[],
  entitlement: Entitlement,
  orgs?: Map<string, { name: string; contactPhone?: string; isVerified: boolean }>,
): PropertyView[] {
  return units.map((unit) => viewFor(unit, entitlement, orgs?.get(unit.property.orgId)));
}
