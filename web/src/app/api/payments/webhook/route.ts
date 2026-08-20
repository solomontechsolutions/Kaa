import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { confirmPayment, failPayment } from "@/lib/subscription/service";

/**
 * The mobile-money provider's callback. The only thing in Kaa that activates
 * a membership.
 *
 * Two properties matter here and both are load-bearing:
 *
 *  • The signature is checked before the body is trusted. Without it, anyone
 *    who learns the endpoint could grant themselves a year of Kaa by POSTing
 *    a reference.
 *  • Confirmation is idempotent. Aggregators retry callbacks, sometimes for
 *    hours; the second delivery must not extend the term.
 */

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET;

  if (!secret) {
    // Refusing is correct. An unsigned webhook that mutates entitlements is a
    // way to buy nothing and receive everything.
    console.error("[payments] PAYMENTS_WEBHOOK_SECRET is not set, refusing callback");
    return false;
  }
  if (!header) return false;

  const provided = Buffer.from(header.replace(/^sha256=/, ""), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

interface Callback {
  reference?: string;
  /** Some aggregators name it differently. */
  order_id?: string;
  transid?: string;
  status?: string;
  result?: string;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-payments-signature") ??
    request.headers.get("x-signature") ??
    request.headers.get("digest");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: Callback;
  try {
    payload = JSON.parse(rawBody) as Callback;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const reference = payload.reference ?? payload.order_id;
  if (!reference) return NextResponse.json({ error: "missing_reference" }, { status: 400 });

  const outcome = (payload.status ?? payload.result ?? "").toLowerCase();
  const succeeded = ["success", "successful", "completed", "paid", "settled"].includes(outcome);

  if (!succeeded) {
    await failPayment(reference);
    // 200 so the provider stops retrying a decision that is final.
    return NextResponse.json({ ok: true, activated: false });
  }

  const result = await confirmPayment(reference, payload.transid);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    activated: true,
    alreadyProcessed: result.alreadyProcessed,
    endsAt: result.subscription.endsAt,
  });
}
