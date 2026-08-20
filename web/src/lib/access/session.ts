/**
 * Resolving an entitlement for the current request.
 *
 * This is the join between "who is calling" (the signed session cookie) and
 * "what have they paid for" (the subscription rows). Everything that renders
 * or serialises a property starts here.
 *
 * Note it reads membership from the store on every call. There is no cached
 * flag and nothing derived from the request body, a header or local storage,
 * so a lapsed membership loses access on the next request rather than at the
 * next login.
 */

import { getAccount } from "@/lib/accounts/store";
import { getAccountId } from "@/lib/accounts/session";
import type { Account, AccountSummary } from "@/lib/accounts/types";
import { getMembership } from "@/lib/subscription/service";
import { maskNida } from "@/lib/accounts/nida";
import { ANONYMOUS, type Entitlement } from "./entitlement";

/** Entitlement for the caller of the current request. */
export async function currentEntitlement(): Promise<Entitlement> {
  const accountId = await getAccountId();
  if (!accountId) return ANONYMOUS;
  return entitlementForAccount(accountId);
}

/**
 * Entitlement for a known account. Used by the WhatsApp webhook, where the
 * caller is identified by a linked phone number rather than a cookie, so that
 * WhatsApp cannot become a way around the paywall.
 */
export async function entitlementForAccount(accountId: string): Promise<Entitlement> {
  const account = await getAccount(accountId);
  if (!account) return ANONYMOUS;

  const membership = await getMembership(accountId);
  const verified = account.nidaStatus === "verified" && Boolean(account.phoneVerifiedAt);

  return {
    level: membership.active ? "member" : "free",
    accountId,
    verified,
    subscriptionEndsAt: membership.endsAt,
  };
}

/** The self-view. The NIN is masked here and nowhere is it unmasked. */
export async function accountSummary(account: Account): Promise<AccountSummary> {
  const membership = await getMembership(account.id);
  return {
    id: account.id,
    fullName: account.fullName,
    nidaMasked: account.nidaLast4 ? maskNida(`${"0".repeat(16)}${account.nidaLast4}`) : undefined,
    nidaVerified: account.nidaStatus === "verified",
    phone: account.phone,
    phoneVerified: Boolean(account.phoneVerifiedAt),
    preferredLanguage: account.preferredLanguage,
    membership: { active: membership.active, endsAt: membership.endsAt },
  };
}
