/**
 * Conversation state for a WhatsApp number.
 *
 * The states exist so the bot knows what a bare "yes" or "number 2" refers to.
 * They are not a script: `parseCriteria` runs on every inbound message, so a
 * tenant sitting in AWAITING_BUDGET who suddenly says "actually make it Sinza,
 * 3 bedrooms" is understood, and the state moves to wherever that leaves them.
 * Being in a state never stops Kaa from listening.
 *
 * Only what the conversation needs to make sense is kept. No message history,
 * no transcript.
 */

import type { SearchCriteria } from "@/lib/search/criteria";

export type ConversationState =
  | "IDLE"
  | "SEARCHING"
  | "AWAITING_LOCATION"
  | "AWAITING_BUDGET"
  | "AWAITING_BEDROOMS"
  | "SHOWING_MATCH_COUNT"
  | "AWAITING_SUBSCRIPTION"
  | "SHOWING_RESULTS"
  | "VIEWING_PROPERTY"
  | "BOOKING_VIEWING"
  | "CONFIRMING_BOOKING";

export interface Conversation {
  phone: string;
  state: ConversationState;
  criteria: SearchCriteria;
  /** Unit ids in the order they were last shown, so "number 2" resolves. */
  lastResults: string[];
  /** How far into `lastResults` the tenant has been shown, for "show me more". */
  shownUpTo: number;
  /** The unit currently being discussed. */
  focusedUnitId?: string;
  /** A viewing time the tenant proposed, pending confirmation. */
  proposedViewingAt?: string;
  accountId?: string;
  updatedAt: number;
}

const globalStore = globalThis as unknown as { __kaaConversations?: Map<string, Conversation> };

function store() {
  globalStore.__kaaConversations ??= new Map();
  return globalStore.__kaaConversations;
}

/** A conversation nobody has touched for a day starts fresh. */
const TTL_MS = 24 * 60 * 60 * 1000;

export function getConversation(phone: string): Conversation {
  const existing = store().get(phone);
  if (existing && Date.now() - existing.updatedAt < TTL_MS) return existing;

  const fresh: Conversation = {
    phone,
    state: "IDLE",
    criteria: { amenities: [] },
    lastResults: [],
    shownUpTo: 0,
    updatedAt: Date.now(),
  };
  store().set(phone, fresh);
  return fresh;
}

export function saveConversation(conversation: Conversation): Conversation {
  const next = { ...conversation, updatedAt: Date.now() };
  store().set(conversation.phone, next);
  return next;
}

export function resetConversation(phone: string) {
  store().delete(phone);
}

/** Test hook. */
export function __resetConversations() {
  globalStore.__kaaConversations = undefined;
}
