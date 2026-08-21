/**
 * Who is calling, across all three identity domains.
 *
 * Kaa deliberately keeps three separate identity stores — a tenant proves
 * who they are to NIDA, a FieldOps employee (and the Kaa operators who
 * review their work) sign in by employee record, a landlord is enrolled by
 * FieldOps and confirms a phone number. Merging them into one account table
 * would blur exactly the distinction this whole authentication pass exists
 * to enforce.
 *
 * What *is* unified is how anything downstream asks "who is this and what
 * are they allowed to see" — one function, one `Role`, checked against the
 * signed cookie for whichever domain the caller belongs to. The role always
 * comes from that domain's own store, never from the cookie, so nothing
 * short of compromising the server can promote a session from one role to
 * another.
 */

import { redirect } from "next/navigation";

import { getAccountId } from "@/lib/accounts/session";
import { currentActor as currentFieldOpsActor } from "@/lib/fieldops/session";
import { currentLandlord } from "@/lib/landlords/session";
import { fromFieldOpsRole, ROLE_HOME, ROLE_SIGN_IN, type Role } from "./roles";

export interface CurrentActor {
  role: Role;
  /** The id within that role's own store — an account id, a landlord id, or an officer id. */
  id: string;
  name?: string;
}

/**
 * Resolves against every session in turn. A request only ever carries one of
 * these cookies in practice, but checking all three costs nothing and means
 * a stray cookie from another portal can never leave someone unauthenticated
 * when they are, in fact, signed in somewhere.
 */
export async function currentActor(): Promise<CurrentActor | null> {
  const fieldOpsActor = await currentFieldOpsActor();
  if (fieldOpsActor) {
    return { role: fromFieldOpsRole(fieldOpsActor.role), id: fieldOpsActor.id, name: fieldOpsActor.name };
  }

  const landlord = await currentLandlord();
  if (landlord) {
    return { role: "LANDLORD", id: landlord.id, name: landlord.fullName };
  }

  const accountId = await getAccountId();
  if (accountId) {
    return { role: "TENANT", id: accountId };
  }

  return null;
}

/**
 * Every role-specific page calls this rather than trusting a layout's
 * redirect — a layout and its page render in parallel in the App Router, so
 * a `redirect()` upstairs does not stop the page below it from running.
 *
 * Wrong role is not the same failure as no session: an authenticated
 * landlord hitting `/operators` is sent back to their own portal, not to a
 * sign-in screen they would just bounce off again.
 */
export async function requireRole(...allowed: Role[]): Promise<CurrentActor> {
  const actor = await currentActor();
  if (!actor) redirect(ROLE_SIGN_IN[allowed[0]]);
  if (!allowed.includes(actor.role)) redirect(ROLE_HOME[actor.role]);
  return actor;
}
