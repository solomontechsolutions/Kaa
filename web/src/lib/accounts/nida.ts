/**
 * NIDA identity verification.
 *
 * Kaa asks NIDA to confirm that a number belongs to a real person and returns
 * the identity fields Kaa is approved to receive. Two rules govern this file:
 *
 *  1. Only fields the data-sharing agreement covers are read. The response is
 *     mapped explicitly — an unexpected field NIDA adds later is dropped, not
 *     stored, because Kaa has no basis to keep it.
 *  2. The number itself is never persisted in the clear and never returned to
 *     a client. What is stored is a salted hash (for "is this NIN already on
 *     an account") and the last four digits (so a tenant recognises their own
 *     record). The full NIN leaves this module only on the wire to NIDA.
 *
 * With no NIDA credentials configured the module runs in development mode:
 * it validates the shape of the number and returns a clearly-marked stub. It
 * never silently pretends a real identity was confirmed — `source` says which
 * it was, and the API surfaces that.
 */

import { createHash, createHmac } from "node:crypto";

import { DEMO_TENANT } from "@/lib/demo/credentials";

export interface NidaIdentity {
  fullName: string;
  dateOfBirth?: string;
  sex?: string;
  nationality?: string;
  /** Only present when NIDA's approved response carries one. */
  phone?: string;
}

export type NidaResult =
  | { ok: true; identity: NidaIdentity; source: "nida" | "development" }
  | { ok: false; reason: "invalid_format" | "not_found" | "unavailable" };

/** NIDA numbers are 20 digits. Spaces and dashes are how people write them. */
export function normalizeNida(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return /^\d{20}$/.test(digits) ? digits : null;
}

/**
 * Salted hash for the uniqueness index. The salt is a server secret, so a
 * leaked database does not let anyone confirm a guessed NIN by hashing it.
 */
export function hashNida(nida: string): string {
  const salt = process.env.NIDA_HASH_SALT;
  if (salt) return createHmac("sha256", salt).update(nida).digest("hex");
  // Without a configured salt this is still a one-way hash, just a weaker one.
  // The startup check in `nidaConfig()` reports the gap rather than hiding it.
  return createHash("sha256").update(nida).digest("hex");
}

export function maskNida(nida: string): string {
  return `${"•".repeat(16)}${nida.slice(-4)}`;
}

export function nidaConfig() {
  return {
    configured: Boolean(process.env.NIDA_API_BASE_URL && process.env.NIDA_API_KEY),
    saltConfigured: Boolean(process.env.NIDA_HASH_SALT),
  };
}

/**
 * Map NIDA's response onto the approved fields, and nothing else.
 * Field names vary between NIDA's environments, hence the alternatives.
 */
function mapIdentity(payload: Record<string, unknown>): NidaIdentity | null {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
  };

  const first = pick("firstName", "FIRSTNAME", "first_name");
  const middle = pick("middleName", "MIDDLENAME", "middle_name");
  const last = pick("lastName", "SURNAME", "surname", "last_name");
  const fullName = pick("fullName", "FULLNAME", "full_name") ?? [first, middle, last].filter(Boolean).join(" ");

  if (!fullName) return null;

  return {
    fullName,
    dateOfBirth: pick("dateOfBirth", "DATEOFBIRTH", "date_of_birth", "dob"),
    sex: pick("sex", "SEX", "gender"),
    nationality: pick("nationality", "NATIONALITY") ?? "Tanzanian",
    phone: pick("phoneNumber", "MOBILENUMBER", "phone"),
  };
}

export async function verifyNida(rawNumber: string): Promise<NidaResult> {
  const nida = normalizeNida(rawNumber);
  if (!nida) return { ok: false, reason: "invalid_format" };

  const { configured } = nidaConfig();

  if (!configured) {
    // Development. The number is well-formed, so the flow can be exercised end
    // to end, but the identity is obviously synthetic and labelled as such.
    //
    // One specific number is reserved for the seeded demo tenant, so signing
    // up with it reconnects to that same account (see `lib/accounts/seed.ts`)
    // instead of minting a new "Development Test Identity" every time — a
    // reviewer can use the documented demo NIDA number and land on an account
    // that already has an active membership and an active rental.
    if (nida === DEMO_TENANT.nida) {
      return {
        ok: true,
        source: "development",
        identity: {
          fullName: DEMO_TENANT.fullName,
          dateOfBirth: "1994-06-18",
          sex: "female",
          nationality: "Tanzanian",
        },
      };
    }

    return {
      ok: true,
      source: "development",
      identity: {
        fullName: "Development Test Identity",
        dateOfBirth: "1998-03-12",
        sex: "unspecified",
        nationality: "Tanzanian",
      },
    };
  }

  try {
    const response = await fetch(`${process.env.NIDA_API_BASE_URL!.replace(/\/$/, "")}/verify`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.NIDA_API_KEY}`,
      },
      body: JSON.stringify({ nin: nida }),
      // NIDA is not always fast, but a tenant is staring at a spinner.
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 404) return { ok: false, reason: "not_found" };
    if (!response.ok) return { ok: false, reason: "unavailable" };

    const payload = (await response.json()) as Record<string, unknown>;
    const identity = mapIdentity((payload.data as Record<string, unknown>) ?? payload);
    if (!identity) return { ok: false, reason: "not_found" };

    return { ok: true, identity, source: "nida" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
