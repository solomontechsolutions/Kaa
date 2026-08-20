import { NextResponse } from "next/server";

import { guarded } from "@/lib/api";
import { getAccountId, SESSION_COOKIE } from "@/lib/accounts/session";
import { getAccount, updateAccount } from "@/lib/accounts/store";
import { accountSummary } from "@/lib/access/session";
import { isLocale } from "@/lib/i18n/config";
import { readJson } from "@/lib/api";

/** The tenant's own record. Anonymous is a normal answer, not an error. */
export async function GET() {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) return NextResponse.json({ account: null });

    const account = await getAccount(accountId);
    if (!account) return NextResponse.json({ account: null });

    return NextResponse.json({ account: await accountSummary(account) });
  });
}

/** Preferences only. Membership and verification are not settable from here. */
export async function PATCH(request: Request) {
  return guarded(async () => {
    const accountId = await getAccountId();
    if (!accountId) return NextResponse.json({ account: null }, { status: 401 });

    const body = await readJson<{ language?: string }>(request);
    if (body?.language && isLocale(body.language)) {
      await updateAccount(accountId, { preferredLanguage: body.language });
    }

    const account = await getAccount(accountId);
    return NextResponse.json({ account: account ? await accountSummary(account) : null });
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
