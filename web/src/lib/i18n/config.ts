/**
 * Kaa speaks three languages.
 *
 * Swahili is the default because Kaa is a Tanzanian-first product and the
 * schema already says so (`profiles.preferred_language`). English is the
 * working language of the operator side. Kinyarwanda is here because Kigali
 * is the next market and the copy layer is cheaper to build now than to
 * retrofit later.
 *
 * The locale is a cookie, not a URL segment. A tenant who switches language
 * keeps their link, and the WhatsApp interface — which has no URL at all —
 * resolves the same locale off the account record.
 */

export const LOCALES = ["sw", "en", "rw"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "sw";

export const LOCALE_COOKIE = "kaa_locale";

/** One year. Language is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_NAMES: Record<Locale, { native: string; english: string; flag: string }> = {
  sw: { native: "Kiswahili", english: "Swahili", flag: "🇹🇿" },
  en: { native: "English", english: "English", flag: "🇬🇧" },
  rw: { native: "Ikinyarwanda", english: "Kinyarwanda", flag: "🇷🇼" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Best locale for a browser `Accept-Language` header, or the default.
 * Only used when the visitor has never chosen: an explicit choice always wins.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
