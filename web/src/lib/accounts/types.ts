import type { Locale } from "@/lib/i18n/config";

export type NidaStatus = "unverified" | "pending" | "verified" | "failed";

/**
 * A Kaa tenant account.
 *
 * Note what is *not* here: the NIDA number itself is stored as a one-way hash
 * plus the last four digits, never in the clear, and it is never serialised
 * to any client. The identity fields kept are the ones the NIDA data-sharing
 * agreement permits Kaa to retain for the service.
 */
export interface Account {
  id: string;
  /** SHA-256 of the normalised NIDA number, salted. Used for uniqueness only. */
  nidaHash?: string;
  /** Last four digits, so a tenant can recognise their own record. */
  nidaLast4?: string;
  nidaStatus: NidaStatus;
  nidaVerifiedAt?: string;

  fullName?: string;
  dateOfBirth?: string;
  sex?: string;
  nationality?: string;

  phone?: string;
  phoneVerifiedAt?: string;

  /** E.164 WhatsApp number, once the conversation is linked to this account. */
  whatsappPhone?: string;

  preferredLanguage: Locale;
  createdAt: string;
  updatedAt: string;
}

/** What the client is ever allowed to see about itself. */
export interface AccountSummary {
  id: string;
  fullName?: string;
  /** `••••••••••••••••1234`. The NIN itself never leaves the server. */
  nidaMasked?: string;
  nidaVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  preferredLanguage: Locale;
  membership: {
    active: boolean;
    endsAt?: string;
  };
}

export interface Subscription {
  id: string;
  accountId: string;
  plan: "tenant_annual";
  amount: number;
  status: "pending" | "active" | "expired" | "failed";
  startsAt?: string;
  endsAt?: string;
  paymentReference: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProperty {
  accountId: string;
  unitId: string;
  savedAt: string;
}
