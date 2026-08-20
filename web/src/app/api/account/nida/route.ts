import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, readJson } from "@/lib/api";
import { hashNida, normalizeNida, verifyNida } from "@/lib/accounts/nida";
import { createAccount, findAccountByNidaHash, updateAccount } from "@/lib/accounts/store";
import { issueToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/accounts/session";
import { isLocale } from "@/lib/i18n/config";

const schema = z.object({
  nida: z.string().min(15).max(40),
  language: z.string().optional(),
});

/**
 * Step one of creating a Kaa account: confirm the person is real.
 *
 * On success this issues a session immediately, because the account now
 * exists — but the account is not *verified* until the phone step also
 * passes, and it holds no membership either way. NIDA verification and paying
 * for Kaa are separate things, and this route is careful never to conflate
 * them.
 *
 * The NIDA number is hashed before it touches storage and is never echoed.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const body = await readJson<unknown>(request);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest();

    const nida = normalizeNida(parsed.data.nida);
    if (!nida) {
      return NextResponse.json({ error: "invalid_nida", message: "A NIDA number is 20 digits." }, { status: 400 });
    }

    const result = await verifyNida(nida);
    if (!result.ok) {
      const status = result.reason === "unavailable" ? 503 : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    const nidaHash = hashNida(nida);
    const existing = await findAccountByNidaHash(nidaHash);

    // A NIN already on an account is not a new registration. Returning the
    // same account rather than a second one is what keeps one person to one
    // Kaa membership; the tenant simply continues where they left off.
    const language = isLocale(parsed.data.language) ? parsed.data.language : undefined;

    const account = existing
      ? (await updateAccount(existing.id, language ? { preferredLanguage: language } : {}))!
      : await createAccount({
          nidaHash,
          nidaLast4: nida.slice(-4),
          nidaStatus: "verified",
          nidaVerifiedAt: new Date().toISOString(),
          fullName: result.identity.fullName,
          dateOfBirth: result.identity.dateOfBirth,
          sex: result.identity.sex,
          nationality: result.identity.nationality,
          preferredLanguage: language ?? "sw",
        });

    const response = NextResponse.json({
      ok: true,
      existingAccount: Boolean(existing),
      // Only the approved identity fields, and never the number itself.
      identity: {
        fullName: account.fullName,
        dateOfBirth: account.dateOfBirth,
        sex: account.sex,
        nationality: account.nationality,
      },
      nidaVerified: true,
      phoneVerified: Boolean(account.phoneVerifiedAt),
      /** `development` means no NIDA credentials are configured on this deployment. */
      source: result.source,
      /** Suggested only when NIDA's approved response carried a number. */
      suggestedPhone: result.identity.phone,
    });

    response.cookies.set(SESSION_COOKIE, issueToken(account.id), sessionCookieOptions);
    return response;
  });
}
