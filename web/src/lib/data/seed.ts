/**
 * Seed dataset — Dar es Salaam.
 *
 * Kaa runs against Supabase in production. This dataset backs the app when no
 * Supabase credentials are configured, so Operators and Field Ops are fully
 * demoable offline. Wards, rent bands and upfront-payment norms are drawn from
 * the Dar es Salaam Region Socio-Economic Profile and the rental-supply study
 * in `docs/research/`.
 */

import type {
  AgentEarning,
  FieldAgent,
  Lease,
  ListingSubmission,
  MaintenanceRequest,
  Organization,
  Payment,
  Property,
  RentInvoice,
  Tenant,
  Unit,
  ViewingRequest,
  Ward,
} from "@/lib/types";

/** Days from now, as an ISO date string. */
function day(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

function dateOnly(offset: number): string {
  return day(offset).slice(0, 10);
}

// ── Geography ──────────────────────────────────────────────────────────

export const wards: Ward[] = [
  { id: "w-mikocheni", districtId: "d-kinondoni", district: "Kinondoni", name: "Mikocheni" },
  { id: "w-msasani", districtId: "d-kinondoni", district: "Kinondoni", name: "Msasani" },
  { id: "w-mwananyamala", districtId: "d-kinondoni", district: "Kinondoni", name: "Mwananyamala" },
  { id: "w-kawe", districtId: "d-kinondoni", district: "Kinondoni", name: "Kawe" },
  { id: "w-sinza", districtId: "d-ubungo", district: "Ubungo", name: "Sinza" },
  { id: "w-kimara", districtId: "d-ubungo", district: "Ubungo", name: "Kimara" },
  { id: "w-mbezi", districtId: "d-ubungo", district: "Ubungo", name: "Mbezi" },
  { id: "w-manzese", districtId: "d-ubungo", district: "Ubungo", name: "Manzese" },
  { id: "w-upanga", districtId: "d-ilala", district: "Ilala", name: "Upanga" },
  { id: "w-kariakoo", districtId: "d-ilala", district: "Ilala", name: "Kariakoo" },
  { id: "w-tabata", districtId: "d-ilala", district: "Ilala", name: "Tabata" },
  { id: "w-mbagala", districtId: "d-temeke", district: "Temeke", name: "Mbagala" },
  { id: "w-kurasini", districtId: "d-temeke", district: "Temeke", name: "Kurasini" },
  { id: "w-changombe", districtId: "d-temeke", district: "Temeke", name: "Chang'ombe" },
  { id: "w-kigamboni", districtId: "d-kigamboni", district: "Kigamboni", name: "Kigamboni" },
];

export const districts = ["Kinondoni", "Ubungo", "Ilala", "Temeke", "Kigamboni"] as const;

// ── Organizations ──────────────────────────────────────────────────────

export const organizations: Organization[] = [
  {
    id: "org-mwanga",
    name: "Mwanga Properties",
    slug: "mwanga-properties",
    type: "property_manager",
    contactPhone: "+255784112233",
    contactEmail: "ops@mwangaproperties.co.tz",
    isVerified: true,
    createdAt: day(-420),
  },
  {
    id: "org-bahari",
    name: "Bahari Estates",
    slug: "bahari-estates",
    type: "developer",
    contactPhone: "+255713445566",
    contactEmail: "info@baharistates.co.tz",
    isVerified: true,
    createdAt: day(-260),
  },
  {
    id: "org-juma",
    name: "Juma Mnyika",
    slug: "juma-mnyika",
    type: "individual_landlord",
    contactPhone: "+255754778899",
    isVerified: false,
    createdAt: day(-95),
  },
];

/** The org the signed-in operator is currently working in. */
export const CURRENT_ORG_ID = "org-mwanga";

// ── Field agents ───────────────────────────────────────────────────────

export const fieldAgents: FieldAgent[] = [
  {
    id: "agent-hamisi",
    agentCode: "KAA-FA-0104",
    fullName: "Hamisi Mwakalinga",
    phone: "+255762334455",
    payoutPhone: "+255762334455",
    payoutMethod: "mpesa",
    zones: ["w-mikocheni", "w-msasani", "w-kawe"],
    isActive: true,
    startedAt: day(-310),
  },
  {
    id: "agent-neema",
    agentCode: "KAA-FA-0118",
    fullName: "Neema Kileo",
    phone: "+255718556677",
    payoutPhone: "+255718556677",
    payoutMethod: "tigopesa",
    zones: ["w-sinza", "w-kimara", "w-mbezi"],
    isActive: true,
    startedAt: day(-198),
  },
  {
    id: "agent-said",
    agentCode: "KAA-FA-0127",
    fullName: "Said Mbaruku",
    phone: "+255786991122",
    payoutPhone: "+255786991122",
    payoutMethod: "airtelmoney",
    zones: ["w-mbagala", "w-kurasini", "w-changombe"],
    isActive: true,
    startedAt: day(-141),
  },
  {
    id: "agent-grace",
    agentCode: "KAA-FA-0133",
    fullName: "Grace Shirima",
    phone: "+255715223344",
    payoutPhone: "+255715223344",
    payoutMethod: "tigopesa",
    zones: ["w-upanga", "w-kariakoo", "w-tabata"],
    isActive: true,
    startedAt: day(-77),
  },
];

/** The agent signed in to Kaa Field Ops. */
export const CURRENT_AGENT_ID = "agent-hamisi";

// ── Properties & units ─────────────────────────────────────────────────

export const properties: Property[] = [
  {
    id: "prop-bahari-court",
    orgId: "org-mwanga",
    name: "Bahari Court",
    type: "apartment_block",
    wardId: "w-mikocheni",
    ward: "Mikocheni",
    district: "Kinondoni",
    addressLine: "Mikocheni B, Rose Garden Road",
    landmark: "Karibu na Shoppers Plaza",
    latitude: -6.7671,
    longitude: 39.2523,
    description:
      "Eight-unit block on a quiet side road off Rose Garden. Borehole water, standby generator for common areas, walled compound with 24-hour security.",
    totalUnits: 8,
    caretakerName: "Rajabu Ally",
    caretakerPhone: "+255754001122",
    isVerified: true,
    verifiedAt: day(-180),
    sourcedByAgentId: "agent-hamisi",
    createdAt: day(-186),
  },
  {
    id: "prop-msasani-villas",
    orgId: "org-mwanga",
    name: "Msasani Peninsula Villas",
    type: "house",
    wardId: "w-msasani",
    ward: "Msasani",
    district: "Kinondoni",
    addressLine: "Msasani Peninsula, Chole Road",
    landmark: "Behind Sea Cliff Village",
    latitude: -6.7418,
    longitude: 39.2795,
    description:
      "Two standalone four-bedroom villas with private gardens and staff quarters. Fully serviced, popular with expatriate and diplomatic tenants.",
    totalUnits: 2,
    caretakerName: "Mama Zawadi",
    caretakerPhone: "+255713889900",
    isVerified: true,
    verifiedAt: day(-150),
    sourcedByAgentId: "agent-hamisi",
    createdAt: day(-155),
  },
  {
    id: "prop-sinza-apartments",
    orgId: "org-mwanga",
    name: "Sinza Madukani Apartments",
    type: "apartment_block",
    wardId: "w-sinza",
    ward: "Sinza",
    district: "Ubungo",
    addressLine: "Sinza Madukani, Shekilango Road",
    landmark: "Opposite Sinza Bus Stand",
    latitude: -6.7794,
    longitude: 39.2201,
    description:
      "Twelve one and two-bedroom units aimed at young professionals. Walking distance to the Shekilango daladala stage and Mlimani City.",
    totalUnits: 12,
    caretakerName: "Emmanuel Kyando",
    caretakerPhone: "+255786223311",
    isVerified: true,
    verifiedAt: day(-92),
    sourcedByAgentId: "agent-neema",
    createdAt: day(-98),
  },
  {
    id: "prop-upanga-heights",
    orgId: "org-mwanga",
    name: "Upanga Heights",
    type: "apartment_block",
    wardId: "w-upanga",
    ward: "Upanga",
    district: "Ilala",
    addressLine: "Upanga West, Ufukoni Street",
    landmark: "Near Aga Khan Hospital",
    latitude: -6.8082,
    longitude: 39.2874,
    description:
      "Six serviced apartments in a converted 1970s block. Lift, covered parking, generator. Five minutes from the CBD.",
    totalUnits: 6,
    caretakerName: "Fatuma Hassan",
    caretakerPhone: "+255715667788",
    isVerified: true,
    verifiedAt: day(-64),
    sourcedByAgentId: "agent-grace",
    createdAt: day(-70),
  },
  {
    id: "prop-kimara-court",
    orgId: "org-mwanga",
    name: "Kimara Stop Over Court",
    type: "apartment_block",
    wardId: "w-kimara",
    ward: "Kimara",
    district: "Ubungo",
    addressLine: "Kimara Stop Over, Morogoro Road",
    landmark: "100m from Kimara BRT terminal",
    latitude: -6.7712,
    longitude: 39.1585,
    description:
      "Affordable family units on the BRT corridor. Metered water and LUKU prepaid electricity per unit.",
    totalUnits: 10,
    caretakerName: "Joseph Mkumbo",
    caretakerPhone: "+255762445566",
    isVerified: true,
    verifiedAt: day(-38),
    sourcedByAgentId: "agent-neema",
    createdAt: day(-44),
  },
  {
    id: "prop-mbagala-rooms",
    orgId: "org-mwanga",
    name: "Mbagala Rangi Tatu Rooms",
    type: "standalone_room",
    wardId: "w-mbagala",
    ward: "Mbagala",
    district: "Temeke",
    addressLine: "Mbagala Rangi Tatu, Kilwa Road",
    landmark: "Nyuma ya soko la Rangi Tatu",
    latitude: -6.9312,
    longitude: 39.2604,
    description:
      "Single and double rooms in a shared compound. Communal water tank, shared ablutions, LUKU per room.",
    totalUnits: 14,
    caretakerName: "Mzee Shabani",
    caretakerPhone: "+255718334455",
    isVerified: false,
    sourcedByAgentId: "agent-said",
    createdAt: day(-12),
  },
];

export const units: Unit[] = [
  // Bahari Court — Mikocheni
  {
    id: "unit-bc-a1", propertyId: "prop-bahari-court", label: "A1",
    bedrooms: 2, bathrooms: 2, sizeSqm: 96, floor: 0, furnishing: "semi_furnished",
    rentAmount: 750_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 412,
    amenities: ["parking", "water_tank", "security", "generator"], images: [],
  },
  {
    id: "unit-bc-a2", propertyId: "prop-bahari-court", label: "A2",
    bedrooms: 2, bathrooms: 2, sizeSqm: 96, floor: 0, furnishing: "unfurnished",
    rentAmount: 700_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "available", listingState: "live", availableFrom: dateOnly(7), viewCount: 189,
    amenities: ["parking", "water_tank", "security"], images: [],
  },
  {
    id: "unit-bc-b1", propertyId: "prop-bahari-court", label: "B1",
    bedrooms: 3, bathrooms: 2, sizeSqm: 128, floor: 1, furnishing: "furnished",
    rentAmount: 1_150_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 604,
    amenities: ["parking", "water_tank", "security", "generator", "balcony", "aircon"], images: [],
  },
  {
    id: "unit-bc-b2", propertyId: "prop-bahari-court", label: "B2",
    bedrooms: 3, bathrooms: 2, sizeSqm: 128, floor: 1, furnishing: "unfurnished",
    rentAmount: 950_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "reserved", listingState: "paused", viewCount: 233,
    amenities: ["parking", "water_tank", "security", "balcony"], images: [],
  },
  {
    id: "unit-bc-c1", propertyId: "prop-bahari-court", label: "C1",
    bedrooms: 2, bathrooms: 1, sizeSqm: 88, floor: 2, furnishing: "unfurnished",
    rentAmount: 680_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "maintenance", listingState: "unlisted", viewCount: 97,
    amenities: ["parking", "water_tank", "security"], images: [],
  },

  // Msasani Peninsula Villas
  {
    id: "unit-mv-1", propertyId: "prop-msasani-villas", label: "Villa 1",
    bedrooms: 4, bathrooms: 4, sizeSqm: 340, furnishing: "furnished",
    rentAmount: 3_200_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 12,
    status: "occupied", listingState: "unlisted", viewCount: 811,
    amenities: ["parking", "garden", "security", "generator", "aircon", "staff_quarters", "borehole"], images: [],
  },
  {
    id: "unit-mv-2", propertyId: "prop-msasani-villas", label: "Villa 2",
    bedrooms: 4, bathrooms: 4, sizeSqm: 340, furnishing: "furnished",
    rentAmount: 3_400_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 12,
    status: "available", listingState: "live", availableFrom: dateOnly(21), viewCount: 356,
    amenities: ["parking", "garden", "security", "generator", "aircon", "staff_quarters", "borehole", "pool"], images: [],
  },

  // Sinza Madukani
  {
    id: "unit-sm-101", propertyId: "prop-sinza-apartments", label: "101",
    bedrooms: 1, bathrooms: 1, sizeSqm: 48, floor: 1, furnishing: "unfurnished",
    rentAmount: 280_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 512,
    amenities: ["water_tank", "security", "luku"], images: [],
  },
  {
    id: "unit-sm-102", propertyId: "prop-sinza-apartments", label: "102",
    bedrooms: 1, bathrooms: 1, sizeSqm: 48, floor: 1, furnishing: "unfurnished",
    rentAmount: 280_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "available", listingState: "live", availableFrom: dateOnly(0), viewCount: 447,
    amenities: ["water_tank", "security", "luku"], images: [],
  },
  {
    id: "unit-sm-201", propertyId: "prop-sinza-apartments", label: "201",
    bedrooms: 2, bathrooms: 1, sizeSqm: 72, floor: 2, furnishing: "unfurnished",
    rentAmount: 420_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 388,
    amenities: ["water_tank", "security", "luku", "balcony"], images: [],
  },
  {
    id: "unit-sm-202", propertyId: "prop-sinza-apartments", label: "202",
    bedrooms: 2, bathrooms: 1, sizeSqm: 72, floor: 2, furnishing: "unfurnished",
    rentAmount: 450_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "available", listingState: "live", availableFrom: dateOnly(14), viewCount: 291,
    amenities: ["water_tank", "security", "luku", "balcony", "parking"], images: [],
  },
  {
    id: "unit-sm-301", propertyId: "prop-sinza-apartments", label: "301",
    bedrooms: 2, bathrooms: 2, sizeSqm: 78, floor: 3, furnishing: "semi_furnished",
    rentAmount: 520_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 265,
    amenities: ["water_tank", "security", "luku", "balcony", "parking"], images: [],
  },

  // Upanga Heights
  {
    id: "unit-uh-2a", propertyId: "prop-upanga-heights", label: "2A",
    bedrooms: 2, bathrooms: 2, sizeSqm: 105, floor: 2, furnishing: "furnished",
    rentAmount: 1_400_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 702,
    amenities: ["lift", "parking", "security", "generator", "aircon", "water_tank"], images: [],
  },
  {
    id: "unit-uh-3a", propertyId: "prop-upanga-heights", label: "3A",
    bedrooms: 2, bathrooms: 2, sizeSqm: 105, floor: 3, furnishing: "furnished",
    rentAmount: 1_450_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 6,
    status: "available", listingState: "live", availableFrom: dateOnly(3), viewCount: 528,
    amenities: ["lift", "parking", "security", "generator", "aircon", "water_tank", "balcony"], images: [],
  },
  {
    id: "unit-uh-3b", propertyId: "prop-upanga-heights", label: "3B",
    bedrooms: 3, bathrooms: 2, sizeSqm: 138, floor: 3, furnishing: "semi_furnished",
    rentAmount: 1_800_000, rentPeriod: "month", depositMonths: 2, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 344,
    amenities: ["lift", "parking", "security", "generator", "aircon", "water_tank"], images: [],
  },

  // Kimara Stop Over
  {
    id: "unit-ks-1", propertyId: "prop-kimara-court", label: "Unit 1",
    bedrooms: 2, bathrooms: 1, sizeSqm: 64, floor: 0, furnishing: "unfurnished",
    rentAmount: 230_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "available", listingState: "live", availableFrom: dateOnly(0), viewCount: 623,
    amenities: ["water_tank", "luku", "security"], images: [],
  },
  {
    id: "unit-ks-2", propertyId: "prop-kimara-court", label: "Unit 2",
    bedrooms: 2, bathrooms: 1, sizeSqm: 64, floor: 0, furnishing: "unfurnished",
    rentAmount: 230_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 401,
    amenities: ["water_tank", "luku", "security"], images: [],
  },
  {
    id: "unit-ks-3", propertyId: "prop-kimara-court", label: "Unit 3",
    bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: 0, furnishing: "unfurnished",
    rentAmount: 150_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "available", listingState: "pending_review", availableFrom: dateOnly(10), viewCount: 0,
    amenities: ["water_tank", "luku"], images: [],
  },
  {
    id: "unit-ks-4", propertyId: "prop-kimara-court", label: "Unit 4",
    bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: 0, furnishing: "unfurnished",
    rentAmount: 150_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 6,
    status: "occupied", listingState: "unlisted", viewCount: 278,
    amenities: ["water_tank", "luku"], images: [],
  },

  // Mbagala rooms
  {
    id: "unit-mb-r1", propertyId: "prop-mbagala-rooms", label: "Room 1",
    bedrooms: 1, bathrooms: 0, sizeSqm: 16, floor: 0, furnishing: "unfurnished",
    rentAmount: 70_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 3,
    status: "available", listingState: "pending_review", availableFrom: dateOnly(0), viewCount: 0,
    amenities: ["shared_water", "luku"], images: [],
  },
  {
    id: "unit-mb-r2", propertyId: "prop-mbagala-rooms", label: "Room 2",
    bedrooms: 1, bathrooms: 0, sizeSqm: 16, floor: 0, furnishing: "unfurnished",
    rentAmount: 70_000, rentPeriod: "month", depositMonths: 1, advanceMonths: 3,
    status: "occupied", listingState: "unlisted", viewCount: 0,
    amenities: ["shared_water", "luku"], images: [],
  },
];

// ── Amenity catalogue ──────────────────────────────────────────────────

export const amenityLabels: Record<string, { en: string; sw: string }> = {
  parking: { en: "Parking", sw: "Maegesho" },
  water_tank: { en: "Water tank", sw: "Tanki la maji" },
  borehole: { en: "Borehole", sw: "Kisima" },
  shared_water: { en: "Shared water", sw: "Maji ya pamoja" },
  security: { en: "24h security", sw: "Ulinzi wa saa 24" },
  generator: { en: "Generator", sw: "Jenereta" },
  luku: { en: "LUKU meter", sw: "Mita ya LUKU" },
  balcony: { en: "Balcony", sw: "Baraza" },
  aircon: { en: "Air conditioning", sw: "Kiyoyozi" },
  lift: { en: "Lift", sw: "Lifti" },
  garden: { en: "Garden", sw: "Bustani" },
  pool: { en: "Swimming pool", sw: "Bwawa la kuogelea" },
  staff_quarters: { en: "Staff quarters", sw: "Chumba cha mfanyakazi" },
};

// ── Field Ops submissions ──────────────────────────────────────────────

export const submissions: ListingSubmission[] = [
  {
    id: "sub-1", reference: "KAA-SUB-2026-00184", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Kawe Beach Apartments", wardId: "w-kawe", ward: "Kawe",
    landlordName: "Ally Nassoro", landlordPhone: "+255754220011",
    unitsCount: 6, proposedRent: 850_000, photoCount: 14,
    capturedAt: day(-1), gpsAccuracyM: 4.2, latitude: -6.7226, longitude: 39.2401,
    status: "submitted", submittedAt: day(-1),
  },
  {
    id: "sub-2", reference: "KAA-SUB-2026-00181", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Mikocheni Light Industrial Flats", wardId: "w-mikocheni", ward: "Mikocheni",
    landlordName: "Zainab Suleiman", landlordPhone: "+255715880099",
    unitsCount: 4, proposedRent: 620_000, photoCount: 11,
    capturedAt: day(-3), gpsAccuracyM: 6.8, latitude: -6.7702, longitude: 39.2489,
    status: "in_review", submittedAt: day(-3),
  },
  {
    id: "sub-3", reference: "KAA-SUB-2026-00176", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Msasani Slipway Studios", wardId: "w-msasani", ward: "Msasani",
    landlordName: "Peter Massawe", landlordPhone: "+255786440022",
    unitsCount: 3, proposedRent: 1_100_000, photoCount: 9,
    capturedAt: day(-6), gpsAccuracyM: 3.1, latitude: -6.7489, longitude: 39.2811,
    status: "changes_requested", submittedAt: day(-6), reviewedAt: day(-4),
    reviewNotes: "Photos 4 and 7 are of the same room. Add a shot of the water source and confirm whether the 6-month advance is negotiable.",
  },
  {
    id: "sub-4", reference: "KAA-SUB-2026-00169", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Bahari Court", wardId: "w-mikocheni", ward: "Mikocheni",
    landlordName: "Mwanga Properties", landlordPhone: "+255784112233",
    unitsCount: 8, proposedRent: 750_000, photoCount: 22,
    capturedAt: day(-14), gpsAccuracyM: 3.9, latitude: -6.7671, longitude: 39.2523,
    status: "approved", submittedAt: day(-14), reviewedAt: day(-12),
  },
  {
    id: "sub-5", reference: "KAA-SUB-2026-00158", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Kawe Ununio Rooms", wardId: "w-kawe", ward: "Kawe",
    landlordName: "Halima Juma", landlordPhone: "+255762770033",
    unitsCount: 5, proposedRent: 120_000, photoCount: 6,
    capturedAt: day(-24), gpsAccuracyM: 18.4, latitude: -6.6901, longitude: 39.2288,
    status: "rejected", submittedAt: day(-24), reviewedAt: day(-22),
    reviewNotes: "GPS accuracy 18m — pin lands on the wrong plot. Landlord could not produce proof of ownership.",
  },
  {
    id: "sub-6", reference: "KAA-SUB-2026-00190", agentId: "agent-hamisi", agentName: "Hamisi Mwakalinga",
    propertyName: "Regent Estate Townhouse", wardId: "w-mikocheni", ward: "Mikocheni",
    landlordName: "David Kimaro", landlordPhone: "+255718002244",
    unitsCount: 1, proposedRent: 1_600_000, photoCount: 3,
    capturedAt: day(0), gpsAccuracyM: 5.5, latitude: -6.7752, longitude: 39.2445,
    status: "draft",
  },
  {
    id: "sub-7", reference: "KAA-SUB-2026-00186", agentId: "agent-neema", agentName: "Neema Kileo",
    propertyName: "Mbezi Beach Court", wardId: "w-mbezi", ward: "Mbezi",
    landlordName: "Rehema Mwinyi", landlordPhone: "+255713991144",
    unitsCount: 9, proposedRent: 540_000, photoCount: 17,
    capturedAt: day(-1), gpsAccuracyM: 5.0, latitude: -6.7011, longitude: 39.2103,
    status: "submitted", submittedAt: day(-1),
  },
  {
    id: "sub-8", reference: "KAA-SUB-2026-00187", agentId: "agent-said", agentName: "Said Mbaruku",
    propertyName: "Kurasini Shimo la Udongo Flats", wardId: "w-kurasini", ward: "Kurasini",
    landlordName: "Omary Chande", landlordPhone: "+255786331177",
    unitsCount: 7, proposedRent: 310_000, photoCount: 12,
    capturedAt: day(-2), gpsAccuracyM: 7.3, latitude: -6.8501, longitude: 39.2812,
    status: "submitted", submittedAt: day(-2),
  },
  {
    id: "sub-9", reference: "KAA-SUB-2026-00188", agentId: "agent-grace", agentName: "Grace Shirima",
    propertyName: "Tabata Segerea Family Homes", wardId: "w-tabata", ward: "Tabata",
    landlordName: "Anna Mushi", landlordPhone: "+255715447788",
    unitsCount: 4, proposedRent: 380_000, photoCount: 10,
    capturedAt: day(-2), gpsAccuracyM: 4.8, latitude: -6.8412, longitude: 39.2211,
    status: "in_review", submittedAt: day(-2),
  },
];

// ── Agent earnings ─────────────────────────────────────────────────────

const LISTING_FEE = 2_000;
const MATCH_BONUS = 5_000;

export const agentEarnings: AgentEarning[] = [
  { id: "earn-1", agentId: "agent-hamisi", kind: "listing_verified", amount: LISTING_FEE * 8, status: "paid", submissionRef: "KAA-SUB-2026-00169", note: "Bahari Court — 8 units verified", earnedAt: day(-12), paidAt: day(-5) },
  { id: "earn-2", agentId: "agent-hamisi", kind: "rental_match", amount: MATCH_BONUS, status: "paid", note: "Bahari Court A1 — tenant moved in", earnedAt: day(-9), paidAt: day(-5) },
  { id: "earn-3", agentId: "agent-hamisi", kind: "rental_match", amount: MATCH_BONUS, status: "paid", note: "Bahari Court B1 — tenant moved in", earnedAt: day(-8), paidAt: day(-5) },
  { id: "earn-4", agentId: "agent-hamisi", kind: "bonus", amount: 25_000, status: "paid", note: "October tier 2 — 20+ verified listings", earnedAt: day(-6), paidAt: day(-5) },
  { id: "earn-5", agentId: "agent-hamisi", kind: "listing_verified", amount: LISTING_FEE * 4, status: "approved", submissionRef: "KAA-SUB-2026-00181", note: "Mikocheni Light Industrial Flats", earnedAt: day(-3) },
  { id: "earn-6", agentId: "agent-hamisi", kind: "listing_verified", amount: LISTING_FEE * 6, status: "accrued", submissionRef: "KAA-SUB-2026-00184", note: "Kawe Beach Apartments — awaiting review", earnedAt: day(-1) },
  { id: "earn-7", agentId: "agent-hamisi", kind: "rental_match", amount: MATCH_BONUS, status: "accrued", note: "Msasani Villa 2 — viewing converted", earnedAt: day(-1) },
];

// ── Tenants, leases, invoices, payments ────────────────────────────────

export const tenants: Tenant[] = [
  { id: "ten-1", orgId: "org-mwanga", fullName: "Asha Mkwawa", phone: "+255754332211", email: "asha.mkwawa@gmail.com", nidaStatus: "verified", createdAt: day(-340) },
  { id: "ten-2", orgId: "org-mwanga", fullName: "Emmanuel Lyimo", phone: "+255713667788", email: "e.lyimo@outlook.com", nidaStatus: "verified", createdAt: day(-290) },
  { id: "ten-3", orgId: "org-mwanga", fullName: "Sarah Njau", phone: "+255786554433", nidaStatus: "pending", createdAt: day(-175) },
  { id: "ten-4", orgId: "org-mwanga", fullName: "Baraka Mollel", phone: "+255762889900", email: "baraka.m@yahoo.com", nidaStatus: "verified", createdAt: day(-160) },
  { id: "ten-5", orgId: "org-mwanga", fullName: "Christine Msoka", phone: "+255715112200", nidaStatus: "verified", createdAt: day(-120) },
  { id: "ten-6", orgId: "org-mwanga", fullName: "Ibrahim Kessy", phone: "+255718445599", nidaStatus: "unverified", createdAt: day(-88) },
  { id: "ten-7", orgId: "org-mwanga", fullName: "Neema Sanga", phone: "+255754990011", email: "neema.sanga@gmail.com", nidaStatus: "verified", createdAt: day(-55) },
  { id: "ten-8", orgId: "org-mwanga", fullName: "Frank Mtei", phone: "+255786220044", nidaStatus: "verified", createdAt: day(-30) },
];

export const leases: Lease[] = [
  { id: "lse-1", reference: "KAA-LSE-2025-00204", unitId: "unit-bc-a1", tenantId: "ten-1", orgId: "org-mwanga", startDate: dateOnly(-330), endDate: dateOnly(35), rentAmount: 750_000, depositAmount: 750_000, paymentDay: 5, status: "ending_soon", signedAt: day(-332), matchedByAgentId: "agent-hamisi", commissionRate: 5 },
  { id: "lse-2", reference: "KAA-LSE-2025-00219", unitId: "unit-bc-b1", tenantId: "ten-2", orgId: "org-mwanga", startDate: dateOnly(-285), endDate: dateOnly(80), rentAmount: 1_150_000, depositAmount: 2_300_000, paymentDay: 1, status: "active", signedAt: day(-287), matchedByAgentId: "agent-hamisi", commissionRate: 5 },
  { id: "lse-3", reference: "KAA-LSE-2025-00240", unitId: "unit-mv-1", tenantId: "ten-4", orgId: "org-mwanga", startDate: dateOnly(-155), endDate: dateOnly(210), rentAmount: 3_200_000, depositAmount: 6_400_000, paymentDay: 1, status: "active", signedAt: day(-158), matchedByAgentId: "agent-hamisi", commissionRate: 5 },
  { id: "lse-4", reference: "KAA-LSE-2025-00258", unitId: "unit-sm-101", tenantId: "ten-3", orgId: "org-mwanga", startDate: dateOnly(-170), endDate: dateOnly(195), rentAmount: 280_000, depositAmount: 280_000, paymentDay: 10, status: "active", signedAt: day(-172), matchedByAgentId: "agent-neema", commissionRate: 5 },
  { id: "lse-5", reference: "KAA-LSE-2025-00271", unitId: "unit-sm-201", tenantId: "ten-5", orgId: "org-mwanga", startDate: dateOnly(-115), endDate: dateOnly(250), rentAmount: 420_000, depositAmount: 420_000, paymentDay: 1, status: "active", signedAt: day(-117), matchedByAgentId: "agent-neema", commissionRate: 5 },
  { id: "lse-6", reference: "KAA-LSE-2026-00288", unitId: "unit-sm-301", tenantId: "ten-6", orgId: "org-mwanga", startDate: dateOnly(-84), endDate: dateOnly(281), rentAmount: 520_000, depositAmount: 520_000, paymentDay: 15, status: "active", signedAt: day(-86), commissionRate: 5 },
  { id: "lse-7", reference: "KAA-LSE-2026-00301", unitId: "unit-uh-2a", tenantId: "ten-7", orgId: "org-mwanga", startDate: dateOnly(-52), endDate: dateOnly(313), rentAmount: 1_400_000, depositAmount: 2_800_000, paymentDay: 1, status: "active", signedAt: day(-54), matchedByAgentId: "agent-grace", commissionRate: 5 },
  { id: "lse-8", reference: "KAA-LSE-2026-00312", unitId: "unit-uh-3b", tenantId: "ten-8", orgId: "org-mwanga", startDate: dateOnly(-26), endDate: dateOnly(339), rentAmount: 1_800_000, depositAmount: 3_600_000, paymentDay: 1, status: "active", signedAt: day(-28), matchedByAgentId: "agent-grace", commissionRate: 5 },
  { id: "lse-9", reference: "KAA-LSE-2026-00320", unitId: "unit-ks-2", tenantId: "ten-3", orgId: "org-mwanga", startDate: dateOnly(-14), endDate: dateOnly(351), rentAmount: 230_000, depositAmount: 230_000, paymentDay: 5, status: "pending_signature", commissionRate: 5 },
];

/** Twelve months of invoices per active lease, back-dated from the lease start. */
export const rentInvoices: RentInvoice[] = leases.flatMap((lease, li) => {
  if (lease.status === "pending_signature" || lease.status === "draft") return [];
  const out: RentInvoice[] = [];
  const start = new Date(lease.startDate);
  for (let i = 0; i < 6; i++) {
    const periodStart = new Date(start);
    periodStart.setMonth(periodStart.getMonth() + i);
    if (periodStart.getTime() > Date.now() + 32 * 864e5) break;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);
    const due = new Date(periodStart);
    due.setDate(lease.paymentDay);

    const overdue = due.getTime() < Date.now();
    // A couple of deliberately unpaid invoices so the arrears view has teeth.
    const delinquent = (li === 3 && i >= 4) || (li === 5 && i === 4);
    const status: RentInvoice["status"] = !overdue ? "pending" : delinquent ? "overdue" : "paid";

    out.push({
      id: `inv-${lease.id}-${i}`,
      reference: `KAA-INV-${String(2600 + li * 10 + i)}`,
      leaseId: lease.id,
      orgId: lease.orgId,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      amountDue: lease.rentAmount,
      amountPaid: status === "paid" ? lease.rentAmount : 0,
      dueDate: due.toISOString().slice(0, 10),
      status,
    });
  }
  return out;
});

const METHODS = ["mpesa", "tigopesa", "airtelmoney", "mpesa", "bank_transfer"] as const;

export const payments: Payment[] = rentInvoices
  .filter((inv) => inv.status === "paid")
  .map((inv, i) => {
    const method = METHODS[i % METHODS.length];
    // Providers charge differently; Kaa shows the fee rather than burying it.
    const feeRate = method === "mpesa" ? 0.008 : method === "bank_transfer" ? 0 : 0.01;
    return {
      id: `pay-${inv.id}`,
      reference: `KAA-PAY-${String(9100 + i)}`,
      invoiceId: inv.id,
      orgId: inv.orgId,
      amount: inv.amountDue,
      feeAmount: Math.round(inv.amountDue * feeRate),
      method,
      payerPhone: "+2557" + String(10_000_000 + i * 137).slice(0, 8),
      providerRef: `${method.toUpperCase().slice(0, 3)}${String(4_800_000 + i * 913)}`,
      status: "succeeded" as const,
      settledAt: `${inv.dueDate}T09:${String(10 + (i % 45)).padStart(2, "0")}:00Z`,
    };
  });

// ── Demand ─────────────────────────────────────────────────────────────

export const viewingRequests: ViewingRequest[] = [
  { id: "vw-1", reference: "KAA-VW-4410", unitId: "unit-bc-a2", orgId: "org-mwanga", requesterName: "Josephine Mrema", requesterPhone: "+255754661122", preferredAt: day(1), status: "requested", createdAt: day(0) },
  { id: "vw-2", reference: "KAA-VW-4409", unitId: "unit-uh-3a", orgId: "org-mwanga", requesterName: "Daniel Shayo", requesterPhone: "+255713220099", preferredAt: day(1), scheduledAt: day(1), assignedAgentId: "agent-grace", status: "scheduled", createdAt: day(0) },
  { id: "vw-3", reference: "KAA-VW-4407", unitId: "unit-mv-2", orgId: "org-mwanga", requesterName: "Lucy Anderson", requesterPhone: "+255786004411", preferredAt: day(2), scheduledAt: day(2), assignedAgentId: "agent-hamisi", status: "scheduled", createdAt: day(-1) },
  { id: "vw-4", reference: "KAA-VW-4403", unitId: "unit-sm-202", orgId: "org-mwanga", requesterName: "Godfrey Massawe", requesterPhone: "+255762335577", preferredAt: day(0), scheduledAt: day(0), assignedAgentId: "agent-neema", status: "scheduled", createdAt: day(-2) },
  { id: "vw-5", reference: "KAA-VW-4398", unitId: "unit-ks-1", orgId: "org-mwanga", requesterName: "Mariam Athumani", requesterPhone: "+255718776655", scheduledAt: day(-2), assignedAgentId: "agent-neema", status: "completed", createdAt: day(-4) },
  { id: "vw-6", reference: "KAA-VW-4392", unitId: "unit-bc-a2", orgId: "org-mwanga", requesterName: "Peter Ngowi", requesterPhone: "+255754889911", scheduledAt: day(-3), assignedAgentId: "agent-hamisi", status: "no_show", createdAt: day(-5) },
  { id: "vw-7", reference: "KAA-VW-4411", unitId: "unit-sm-102", orgId: "org-mwanga", requesterName: "Rehema Kimambo", requesterPhone: "+255715330088", preferredAt: day(2), status: "requested", createdAt: day(0) },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: "mnt-1", reference: "KAA-MNT-812", unitId: "unit-bc-c1", orgId: "org-mwanga", title: "Bathroom ceiling leak", description: "Water coming through from the unit above after heavy rain. Tenant has moved furniture out of the way.", priority: "urgent", status: "in_progress", createdAt: day(-4) },
  { id: "mnt-2", reference: "KAA-MNT-809", unitId: "unit-sm-201", orgId: "org-mwanga", title: "Kitchen tap not running", description: "No pressure on the kitchen tap; bathroom is fine.", priority: "normal", status: "acknowledged", createdAt: day(-6) },
  { id: "mnt-3", reference: "KAA-MNT-806", unitId: "unit-uh-2a", orgId: "org-mwanga", title: "Lift stuck on 2nd floor", priority: "high", status: "resolved", createdAt: day(-11), resolvedAt: day(-9) },
  { id: "mnt-4", reference: "KAA-MNT-814", unitId: "unit-ks-2", orgId: "org-mwanga", title: "LUKU meter not accepting tokens", priority: "high", status: "open", createdAt: day(-1) },
  { id: "mnt-5", reference: "KAA-MNT-815", unitId: "unit-bc-b1", orgId: "org-mwanga", title: "Gate motor grinding", description: "Automatic gate makes a loud noise and stalls halfway.", priority: "normal", status: "open", createdAt: day(0) },
];
