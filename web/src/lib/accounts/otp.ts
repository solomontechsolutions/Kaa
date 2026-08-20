/**
 * Phone confirmation by one-time code.
 *
 * NIDA proves who someone is. It does not prove they are holding the phone
 * they typed in, and the schema's approved NIDA response may not carry a
 * usable number at all — so the phone is confirmed separately, always.
 *
 * The code is stored hashed with its expiry and an attempt counter. Rate
 * limiting is per number: five sends an hour, five guesses per code. Without
 * an SMS provider configured the code is logged server-side so the flow can
 * be exercised in development; it is never returned in a response body.
 */

import { createHash, randomInt } from "node:crypto";

interface Challenge {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sends: number;
  windowStartedAt: number;
}

const globalStore = globalThis as unknown as { __kaaOtp?: Map<string, Challenge> };

function store() {
  globalStore.__kaaOtp ??= new Map();
  return globalStore.__kaaOtp;
}

const CODE_TTL_MS = 5 * 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 5;

function hash(code: string, phone: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export type OtpSendResult =
  | { ok: true; expiresAt: number; delivered: boolean }
  | { ok: false; reason: "rate_limited" };

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const db = store();
  const existing = db.get(phone);
  const nowMs = Date.now();

  let sends = 1;
  let windowStartedAt = nowMs;
  if (existing && nowMs - existing.windowStartedAt < SEND_WINDOW_MS) {
    if (existing.sends >= MAX_SENDS_PER_WINDOW) return { ok: false, reason: "rate_limited" };
    sends = existing.sends + 1;
    windowStartedAt = existing.windowStartedAt;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = nowMs + CODE_TTL_MS;

  db.set(phone, { phone, codeHash: hash(code, phone), expiresAt, attempts: 0, sends, windowStartedAt });

  const delivered = await deliver(phone, code);
  return { ok: true, expiresAt, delivered };
}

async function deliver(phone: string, code: string): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER;
  const key = process.env.SMS_API_KEY;

  if (!provider || !key) {
    // Development only. The code never travels in an HTTP response.
    console.info(`[otp] no SMS provider configured — code for ${phone} is ${code}`);
    return false;
  }

  try {
    const response = await fetch(`${process.env.SMS_API_BASE_URL ?? provider}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        to: phone,
        message: `${code} ni namba yako ya Kaa. Usimpe mtu yeyote. / ${code} is your Kaa code. Do not share it.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_challenge" | "expired" | "too_many_attempts" | "incorrect" };

export async function verifyOtp(phone: string, code: string): Promise<OtpVerifyResult> {
  const db = store();
  const challenge = db.get(phone);
  if (!challenge) return { ok: false, reason: "no_challenge" };
  if (Date.now() > challenge.expiresAt) {
    db.delete(phone);
    return { ok: false, reason: "expired" };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  challenge.attempts += 1;

  if (hash(code.trim(), phone) !== challenge.codeHash) {
    db.set(phone, challenge);
    return { ok: false, reason: "incorrect" };
  }

  db.delete(phone);
  return { ok: true };
}

/** Test hook. */
export function __resetOtp() {
  globalStore.__kaaOtp = undefined;
}
