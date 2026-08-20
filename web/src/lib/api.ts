/**
 * Shared plumbing for Kaa's route handlers.
 *
 * The paywall response is standardised here so every locked operation answers
 * identically — HTTP 402, the operation that was refused, and the price. A
 * client cannot tell the difference between "you may not see this" and "this
 * does not exist" by the shape of the error, and it always knows what to
 * offer the tenant next.
 */

import { NextResponse } from "next/server";

import { PaywallError, type ProtectedOperation } from "@/lib/access/entitlement";
import { TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

export function paywall(operation: ProtectedOperation) {
  return NextResponse.json(
    {
      error: "membership_required",
      operation,
      message: "This is available to Kaa members.",
      price: { amount: TENANT_ANNUAL_PRICE_TZS, currency: "TZS", period: "year" },
    },
    { status: 402 },
  );
}

export function unauthorized() {
  return NextResponse.json({ error: "account_required" }, { status: 401 });
}

export function badRequest(message = "Invalid request") {
  return NextResponse.json({ error: "bad_request", message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

/** Wraps a handler so a `PaywallError` thrown anywhere below becomes a 402. */
export async function guarded(run: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof PaywallError) return paywall(error.operation);
    console.error("[api] unhandled", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
