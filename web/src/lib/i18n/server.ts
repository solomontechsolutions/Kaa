import { cookies, headers } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./config";
import { translator, type Translate } from "./index";

/**
 * The locale for this request.
 *
 * An explicit choice (the cookie) always beats the browser's preference, and
 * the browser's preference beats the Swahili default. Server Components read
 * this; nothing needs a provider or a client boundary to render translated.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  try {
    const headerStore = await headers();
    return localeFromAcceptLanguage(headerStore.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getTranslate(): Promise<Translate> {
  return translator(await getLocale());
}

/** Both, for the common case where a page needs the tag as well as the copy. */
export async function getI18n(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
