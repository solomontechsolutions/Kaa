/**
 * FieldOps — the data-collection domain.
 *
 * FieldOps is a separate operating entity, jointly owned by Kaa and an
 * established dalali. Its employees visit properties on Kaa's behalf, collect
 * what Kaa needs, and submit it for Kaa to review. Nothing they collect is a
 * Kaa property until a Kaa operator says so.
 *
 * That boundary is why this module exists apart from `lib/data`: a submission
 * is FieldOps' record, a property is Kaa's, and the only bridge between them
 * is an approval.
 */

/**
 * The life of a submission.
 *
 * The first three belong to the handset — a submission in DRAFT or
 * READY_FOR_UPLOAD has never left the device and Kaa cannot see it. From
 * UPLOADED onward it is FieldOps' and Kaa's shared record.
 *
 *   DRAFT ─▶ READY_FOR_UPLOAD ─▶ UPLOADING ─▶ UPLOADED ─▶ UNDER_REVIEW
 *                                                             │
 *                                            ┌────────────────┴──────────────┐
 *                                            ▼                               ▼
 *                                    CORRECTION_REQUIRED                 APPROVED
 *                                            │                               │
 *                                            ▼                     (becomes a Kaa property)
 *                                       RESUBMITTED ─▶ UNDER_REVIEW
 *                                            │
 *                                            ▼
 *                                        REJECTED
 */
export type SubmissionStatus =
  | "DRAFT"
  | "READY_FOR_UPLOAD"
  | "UPLOADING"
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUIRED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED";

/** Statuses that exist only on the handset. Kaa never sees these. */
export const DEVICE_ONLY_STATUSES: SubmissionStatus[] = ["DRAFT", "READY_FOR_UPLOAD", "UPLOADING"];

/** Statuses that put the submission in Kaa's queue. */
export const IN_REVIEW_STATUSES: SubmissionStatus[] = ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"];

/** Statuses that put the ball back in the officer's court. */
export const OFFICER_ACTION_STATUSES: SubmissionStatus[] = ["DRAFT", "CORRECTION_REQUIRED"];

export const TERMINAL_STATUSES: SubmissionStatus[] = ["APPROVED", "REJECTED"];

export type PropertyKind =
  | "apartment"
  | "house"
  | "standalone_room"
  | "shared_house"
  | "bedsitter"
  | "commercial";

export type HouseType = "self_contained" | "shared_facilities" | "master_ensuite" | "studio" | "duplex" | "bungalow";

export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";

export type PropertyCondition = "new" | "excellent" | "good" | "fair" | "needs_work";

export type WaterAvailability = "piped_reliable" | "piped_intermittent" | "borehole" | "tank_only" | "shared_point";

export type PhotoRoom = "exterior" | "living_room" | "bedroom" | "kitchen" | "bathroom" | "compound" | "other";

export interface SubmissionPhoto {
  id: string;
  room: PhotoRoom;
  /** Object URL on the handset, storage path once uploaded. */
  uri: string;
  capturedAt: string;
  /** Bytes. Shown so an officer on a metered connection knows the cost. */
  size?: number;
  caption?: string;
}

/**
 * The property record an officer collects.
 *
 * Almost everything is optional because a draft is legitimately incomplete —
 * an officer standing in the sun fills what they can see and returns to the
 * rest. `readyToUpload` in the service decides what "complete enough" means,
 * not the type.
 */
export interface CollectedProperty {
  propertyKind?: PropertyKind;
  houseType?: HouseType;
  bedrooms?: number;
  bathrooms?: number;
  /** Whole shillings, per month. */
  monthlyRent?: number;
  furnishing?: Furnishing;
  availableFrom?: string;
  condition?: PropertyCondition;
  sizeSqm?: number;

  region?: string;
  district?: string;
  ward?: string;
  area?: string;
  street?: string;
  addressLine?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  /** Metres. The gate on capture quality — a 300 m fix is not a location. */
  gpsAccuracyM?: number;
  gpsCapturedAt?: string;

  /** Amenity slugs, matching Kaa's amenity catalogue. */
  amenities: string[];
  parkingSpaces?: number;
  water?: WaterAvailability;
  hasSecurity?: boolean;
  hasElectricity?: boolean;
  utilitiesNote?: string;

  landlordName?: string;
  landlordPhone?: string;
  caretakerName?: string;
  caretakerPhone?: string;
  /** Recorded in person. FieldOps enrols the landlord; they never sign up. */
  landlordConsent?: boolean;

  notes?: string;
}

/** A Kaa operator asking for something to be fixed, and what happened next. */
export interface CorrectionRequest {
  id: string;
  submissionId: string;
  /** Kaa operator, not a FieldOps employee. */
  raisedBy: string;
  raisedByName: string;
  raisedAt: string;
  /** What is wrong, in the operator's words. Shown verbatim to the officer. */
  message: string;
  /** Fields the operator flagged, so the app can take the officer straight there. */
  fields: string[];
  resolvedAt?: string;
}

export type AuditAction =
  | "created"
  | "edited"
  | "marked_ready"
  | "uploaded"
  | "opened_for_review"
  | "correction_requested"
  | "resubmitted"
  | "approved"
  | "rejected"
  | "assigned"
  | "photo_added"
  | "photo_removed"
  | "gps_captured";

/**
 * One line of the record. FieldOps is an operational data process and its
 * value to Kaa rests on being able to say who collected what, when, and who
 * accepted it — so every action that changes a submission writes one of these.
 */
export interface AuditEvent {
  id: string;
  submissionId: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: FieldOpsRole;
  action: AuditAction;
  /** One sentence, already readable. The UI does not reconstruct prose. */
  detail: string;
}

export interface PropertySubmission {
  id: string;
  /** KA-000241. What everyone says out loud. */
  reference: string;
  status: SubmissionStatus;

  officerId: string;
  officerName: string;

  property: CollectedProperty;
  photos: SubmissionPhoto[];

  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;

  /** Set when approved: the Kaa unit this became. The bridge between entities. */
  kaaUnitId?: string;

  /** How many times this has been round the loop. */
  submissionCount: number;
  corrections: CorrectionRequest[];
  history: AuditEvent[];
}

// ── People ─────────────────────────────────────────────────────────────

/**
 * The permission tier an actor holds over a submission — not the same thing
 * as which entity's payroll they're on. A Kaa operator's identity lives
 * entirely in `lib/operators/`, a separate table on Kaa's side; this role
 * only ever reaches an `Actor` (see `permissions.ts`) via that module's
 * session, never via a `FieldOfficer` row. FieldOps' own employee table can
 * only ever hold `FieldOpsEmployeeRole` — see below — which is the
 * enforcement that a Kaa operator cannot be a row in FieldOps' own roster.
 */
export type FieldOpsRole = "field_officer" | "fieldops_supervisor" | "kaa_operator";

/** What FieldOps' own employee table may actually contain. No `kaa_operator` — that identity is not FieldOps'. */
export type FieldOpsEmployeeRole = Exclude<FieldOpsRole, "kaa_operator">;

export interface FieldOfficer {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  role: FieldOpsEmployeeRole;
  /** Wards this officer works. Hyperlocal saturation beats citywide spread. */
  assignedAreas: string[];
  isActive: boolean;
  startedAt: string;
  lastActiveAt?: string;
  /** The PDU in their hand, so a lost device can be traced to a person. */
  deviceId?: string;
  /** `<salt-hex>:<hash-hex>` from `lib/auth/password.ts`. Never the password itself. */
  passwordHash: string;
}

export interface Assignment {
  id: string;
  officerId: string;
  ward: string;
  target: number;
  collected: number;
  dueOn: string;
  note?: string;
}
