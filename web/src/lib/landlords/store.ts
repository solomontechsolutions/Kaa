/**
 * Landlord storage.
 *
 * Same posture as the rest of Kaa: an in-process store, per-process, resets
 * on deploy — a development store, never an operational one. A landlord is
 * looked up by phone at sign-in (the phone + OTP flow) or by email (the
 * password flow); there is no self-registration to build a store around.
 */

import type { Landlord } from "./types";
import { seedLandlords } from "./seed";

interface Tables {
  landlords: Map<string, Landlord>;
  phoneIndex: Map<string, string>;
  emailIndex: Map<string, string>;
}

const globalStore = globalThis as unknown as { __kaaLandlords?: Tables };

function tables(): Tables {
  if (!globalStore.__kaaLandlords) {
    const landlords = new Map(seedLandlords().map((row) => [row.id, row]));
    globalStore.__kaaLandlords = {
      landlords,
      phoneIndex: new Map([...landlords.values()].map((row) => [row.phone, row.id])),
      emailIndex: new Map(
        [...landlords.values()].filter((row) => row.email).map((row) => [row.email!.toLowerCase(), row.id]),
      ),
    };
  }
  return globalStore.__kaaLandlords;
}

export function getLandlord(id: string): Landlord | undefined {
  return tables().landlords.get(id);
}

export function findLandlordByPhone(phone: string): Landlord | undefined {
  const id = tables().phoneIndex.get(phone);
  return id ? tables().landlords.get(id) : undefined;
}

export function findLandlordByEmail(email: string): Landlord | undefined {
  const id = tables().emailIndex.get(email.trim().toLowerCase());
  return id ? tables().landlords.get(id) : undefined;
}

export function listLandlords(): Landlord[] {
  return [...tables().landlords.values()];
}

/** Test hook. */
export function __resetLandlords() {
  globalStore.__kaaLandlords = undefined;
}
