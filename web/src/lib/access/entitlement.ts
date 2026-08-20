/**
 * What this caller is allowed to see.
 *
 * One rule, in one place, checked on the server. Every surface — the mobile
 * app, the website, the WhatsApp webhook — resolves an `Entitlement` and then
 * passes it to the redaction boundary. Nothing renders a property without one.
 *
 * The client is never asked what it is entitled to. A flag in local storage,
 * a header, a field in a request body: none of them influence this.
 */

export type AccessLevel =
  /** No Kaa account at all. Can search, sees counts only. */
  | "anonymous"
  /** Verified Kaa account, no active membership. Search + previews. */
  | "free"
  /** TZS 10,000 paid and confirmed, inside the 12 months. */
  | "member";

export interface Entitlement {
  level: AccessLevel;
  accountId?: string;
  /** NIDA and phone both confirmed. An account exists before this is true. */
  verified: boolean;
  subscriptionEndsAt?: string;
}

export const ANONYMOUS: Entitlement = { level: "anonymous", verified: false };

export function isMember(entitlement: Entitlement): boolean {
  return entitlement.level === "member";
}

/** The operations the paywall protects. Named so the tests can enumerate them. */
export const PROTECTED_OPERATIONS = [
  "view_full_property",
  "view_property_photos",
  "view_full_amenities",
  "view_landlord_details",
  "save_property",
  "request_viewing",
  "contact_landlord",
  "whatsapp_property_results",
] as const;

export type ProtectedOperation = (typeof PROTECTED_OPERATIONS)[number];

export function can(entitlement: Entitlement, operation: ProtectedOperation): boolean {
  // Every protected operation needs an active membership. Searching, seeing
  // the count and seeing a redacted preview are not on this list — those are
  // free on purpose, they are how a tenant learns Kaa has what they need.
  void operation;
  return isMember(entitlement);
}

/** Thrown shape for API routes; the message is safe to show a tenant. */
export class PaywallError extends Error {
  readonly operation: ProtectedOperation;
  readonly status = 402;

  constructor(operation: ProtectedOperation) {
    super("This is available to Kaa members.");
    this.name = "PaywallError";
    this.operation = operation;
  }
}

export function assertCan(entitlement: Entitlement, operation: ProtectedOperation) {
  if (!can(entitlement, operation)) throw new PaywallError(operation);
}
