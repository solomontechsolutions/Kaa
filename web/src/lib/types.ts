/**
 * Domain types for Kaa.
 *
 * These mirror `supabase/migrations/0001_init.sql`. When the schema moves,
 * these move with it — they are the contract every surface reads through.
 */

export type AppRole =
  | "tenant"
  | "landlord"
  | "operator_staff"
  | "field_agent"
  | "field_supervisor"
  | "platform_admin";

export type OrgType = "individual_landlord" | "property_manager" | "developer" | "platform";
export type OrgMemberRole = "owner" | "manager" | "staff" | "viewer";

export type PropertyType =
  | "apartment_block"
  | "house"
  | "standalone_room"
  | "shared_house"
  | "commercial"
  | "land";

export type UnitStatus = "draft" | "available" | "reserved" | "occupied" | "maintenance" | "off_market";
export type ListingState = "unlisted" | "pending_review" | "live" | "rejected" | "expired" | "paused";
export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";
export type VerificationStatus = "unverified" | "pending" | "verified" | "failed" | "expired";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected";

export type LeaseStatus = "draft" | "pending_signature" | "active" | "ending_soon" | "ended" | "terminated";
export type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "waived";
export type PaymentMethod = "mpesa" | "tigopesa" | "airtelmoney" | "halopesa" | "bank_transfer" | "cash" | "card";
export type PaymentStatus = "initiated" | "pending" | "succeeded" | "failed" | "refunded";

export type ViewingStatus = "requested" | "scheduled" | "completed" | "no_show" | "cancelled";
export type MaintenanceStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "closed";
export type MaintenancePriority = "low" | "normal" | "high" | "urgent";

export type EarningKind = "listing_verified" | "rental_match" | "bonus" | "adjustment";
export type EarningStatus = "accrued" | "approved" | "paid" | "reversed";

export interface Ward {
  id: string;
  districtId: string;
  district: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  contactPhone: string;
  contactEmail?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguage: "sw" | "en";
  nidaStatus: VerificationStatus;
  roles: AppRole[];
}

export interface Property {
  id: string;
  orgId: string;
  name: string;
  type: PropertyType;
  wardId: string;
  ward: string;
  district: string;
  addressLine: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  description?: string;
  totalUnits: number;
  caretakerName?: string;
  caretakerPhone?: string;
  isVerified: boolean;
  verifiedAt?: string;
  sourcedByAgentId?: string;
  coverImage?: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  floor?: number;
  furnishing: Furnishing;
  /** Whole Tanzanian shillings. */
  rentAmount: number;
  rentPeriod: "month" | "quarter" | "year";
  depositMonths: number;
  /** Months of rent demanded upfront — the number tenants get ambushed with. */
  advanceMonths: number;
  status: UnitStatus;
  listingState: ListingState;
  availableFrom?: string;
  viewCount: number;
  amenities: string[];
  images: string[];
}

export interface UnitWithProperty extends Unit {
  property: Property;
}

export interface FieldAgent {
  id: string;
  agentCode: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  supervisorId?: string;
  payoutPhone: string;
  payoutMethod: PaymentMethod;
  zones: string[];
  isActive: boolean;
  startedAt: string;
}

export interface ListingSubmission {
  id: string;
  reference: string;
  agentId: string;
  agentName: string;
  propertyName: string;
  wardId: string;
  ward: string;
  landlordName: string;
  landlordPhone: string;
  unitsCount: number;
  proposedRent: number;
  photoCount: number;
  capturedAt: string;
  gpsAccuracyM: number;
  latitude: number;
  longitude: number;
  status: SubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AgentEarning {
  id: string;
  agentId: string;
  kind: EarningKind;
  amount: number;
  status: EarningStatus;
  submissionRef?: string;
  note?: string;
  earnedAt: string;
  paidAt?: string;
}

export interface Tenant {
  id: string;
  orgId: string;
  fullName: string;
  phone: string;
  email?: string;
  nidaStatus: VerificationStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface Lease {
  id: string;
  reference: string;
  unitId: string;
  tenantId: string;
  orgId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  paymentDay: number;
  status: LeaseStatus;
  signedAt?: string;
  matchedByAgentId?: string;
  commissionRate: number;
}

export interface RentInvoice {
  id: string;
  reference: string;
  leaseId: string;
  orgId: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface Payment {
  id: string;
  reference: string;
  invoiceId?: string;
  orgId: string;
  amount: number;
  feeAmount: number;
  method: PaymentMethod;
  payerPhone: string;
  providerRef?: string;
  status: PaymentStatus;
  settledAt?: string;
}

export interface ViewingRequest {
  id: string;
  reference: string;
  unitId: string;
  orgId: string;
  requesterName: string;
  requesterPhone: string;
  preferredAt?: string;
  scheduledAt?: string;
  assignedAgentId?: string;
  status: ViewingStatus;
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  reference: string;
  unitId: string;
  orgId: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt?: string;
}
