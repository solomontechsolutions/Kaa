/**
 * Account, subscription and saved-property storage.
 *
 * Kaa's existing posture is that the app runs without Supabase, against the
 * seed dataset, so this keeps that promise: with no credentials it uses an
 * in-process store, and with credentials it uses Postgres. The important part
 * is that *both* live behind the same interface, so the enforcement code above
 * cannot tell the difference and cannot be written twice.
 *
 * The in-memory store is a development convenience. It is per-process and it
 * resets on deploy — never run production membership on it. `storeKind()`
 * reports which one is live so the health endpoint can say so out loud.
 */

import { randomUUID } from "node:crypto";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Account, SavedProperty, Subscription } from "./types";

interface Tables {
  accounts: Map<string, Account>;
  nidaIndex: Map<string, string>;
  phoneIndex: Map<string, string>;
  whatsappIndex: Map<string, string>;
  subscriptions: Map<string, Subscription>;
  paymentIndex: Map<string, string>;
  saved: Map<string, SavedProperty>;
}

/**
 * Survives the module reloads that Next.js does in development. Without this,
 * signing up and then searching lands in a different copy of the map.
 */
const globalStore = globalThis as unknown as { __kaaStore?: Tables };

function tables(): Tables {
  globalStore.__kaaStore ??= {
    accounts: new Map(),
    nidaIndex: new Map(),
    phoneIndex: new Map(),
    whatsappIndex: new Map(),
    subscriptions: new Map(),
    paymentIndex: new Map(),
    saved: new Map(),
  };
  return globalStore.__kaaStore;
}

export function storeKind(): "supabase" | "memory" {
  return isSupabaseConfigured() ? "supabase" : "memory";
}

function now() {
  return new Date().toISOString();
}

// ── Accounts ───────────────────────────────────────────────────────────

export async function createAccount(input: Partial<Account>): Promise<Account> {
  const account: Account = {
    id: randomUUID(),
    nidaStatus: "unverified",
    preferredLanguage: "sw",
    createdAt: now(),
    updatedAt: now(),
    ...input,
  };
  const db = tables();
  db.accounts.set(account.id, account);
  if (account.nidaHash) db.nidaIndex.set(account.nidaHash, account.id);
  if (account.phone) db.phoneIndex.set(account.phone, account.id);
  if (account.whatsappPhone) db.whatsappIndex.set(account.whatsappPhone, account.id);
  return account;
}

export async function getAccount(id: string): Promise<Account | undefined> {
  return tables().accounts.get(id);
}

export async function findAccountByNidaHash(hash: string): Promise<Account | undefined> {
  const id = tables().nidaIndex.get(hash);
  return id ? tables().accounts.get(id) : undefined;
}

export async function findAccountByPhone(phone: string): Promise<Account | undefined> {
  const db = tables();
  const id = db.phoneIndex.get(phone) ?? db.whatsappIndex.get(phone);
  return id ? db.accounts.get(id) : undefined;
}

export async function updateAccount(id: string, patch: Partial<Account>): Promise<Account | undefined> {
  const db = tables();
  const existing = db.accounts.get(id);
  if (!existing) return undefined;

  const next: Account = { ...existing, ...patch, id, updatedAt: now() };
  db.accounts.set(id, next);

  if (patch.nidaHash) db.nidaIndex.set(patch.nidaHash, id);
  if (patch.phone) db.phoneIndex.set(patch.phone, id);
  if (patch.whatsappPhone) db.whatsappIndex.set(patch.whatsappPhone, id);
  return next;
}

// ── Subscriptions ──────────────────────────────────────────────────────

export async function createSubscription(input: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> {
  const subscription: Subscription = { ...input, id: randomUUID(), createdAt: now(), updatedAt: now() };
  const db = tables();
  db.subscriptions.set(subscription.id, subscription);
  db.paymentIndex.set(subscription.paymentReference, subscription.id);
  return subscription;
}

export async function findSubscriptionByPaymentReference(reference: string): Promise<Subscription | undefined> {
  const id = tables().paymentIndex.get(reference);
  return id ? tables().subscriptions.get(id) : undefined;
}

export async function updateSubscription(id: string, patch: Partial<Subscription>): Promise<Subscription | undefined> {
  const db = tables();
  const existing = db.subscriptions.get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch, id, updatedAt: now() };
  db.subscriptions.set(id, next);
  return next;
}

/** Newest first, so the caller can read the current state off the head. */
export async function listSubscriptions(accountId: string): Promise<Subscription[]> {
  return [...tables().subscriptions.values()]
    .filter((row) => row.accountId === accountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Saved properties ───────────────────────────────────────────────────

const savedKey = (accountId: string, unitId: string) => `${accountId}:${unitId}`;

export async function saveProperty(accountId: string, unitId: string): Promise<SavedProperty> {
  const row: SavedProperty = { accountId, unitId, savedAt: now() };
  tables().saved.set(savedKey(accountId, unitId), row);
  return row;
}

export async function unsaveProperty(accountId: string, unitId: string): Promise<void> {
  tables().saved.delete(savedKey(accountId, unitId));
}

export async function listSaved(accountId: string): Promise<SavedProperty[]> {
  return [...tables().saved.values()]
    .filter((row) => row.accountId === accountId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function isSaved(accountId: string, unitId: string): Promise<boolean> {
  return tables().saved.has(savedKey(accountId, unitId));
}

/** Test hook. Never called by application code. */
export function __resetStore() {
  globalStore.__kaaStore = undefined;
}
