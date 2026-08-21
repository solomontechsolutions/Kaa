/**
 * Password hashing, for the accounts that actually use one.
 *
 * scrypt rather than a dependency: it is in `node:crypto`, it is deliberately
 * slow against brute force, and every other credential in this codebase
 * (session tokens, OTP codes) already leans on `node:crypto` rather than
 * pulling in a package for it.
 *
 * A password is never compared with `===`. Two equal-length buffers still
 * take the same time to compare via `timingSafeEqual`; a length mismatch is
 * rejected before that call, since `timingSafeEqual` throws on differing
 * lengths rather than returning false.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/** `<salt-hex>:<hash-hex>`. Store this, never the password itself. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const actual = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
