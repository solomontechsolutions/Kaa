import { describe, expect, it } from "vitest";

import { LOCALES, localeFromAcceptLanguage, isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { dictionaries, translator } from "@/lib/i18n";
import { PHRASES, detectLocale, phrase } from "@/lib/whatsapp/phrases";

/** Every leaf key in a nested object, dotted. */
function keysOf(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    keysOf(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("the three languages", () => {
  it("is Swahili, English and Kinyarwanda, with Swahili the default", () => {
    expect([...LOCALES].sort()).toEqual(["en", "rw", "sw"]);
    expect(DEFAULT_LOCALE).toBe("sw");
  });

  it("has no gaps — every key exists in all three", () => {
    const reference = keysOf(dictionaries.en).sort();
    for (const locale of LOCALES) {
      expect(keysOf(dictionaries[locale]).sort()).toEqual(reference);
    }
  });

  it("has no key left in English by accident in the other two", () => {
    // A handful are legitimately identical across languages: the brand name,
    // words Swahili and English share, and a phone-number format that is the
    // same shape whatever language it is labelled in. Everything else that
    // matches the English is a forgotten translation.
    const shared = [
      "common.appName",
      "common.search",
      "tabs.search",
      "splash.greeting",       // "Karibu" — the app greets in Swahili throughout
      "join.phonePlaceholder", // 07XXXXXXXX
    ];

    for (const locale of ["sw", "rw"] as const) {
      const untranslated = keysOf(dictionaries.en)
        .filter((key) => !shared.includes(key))
        .filter((key) => translator(locale)(key) === translator("en")(key));

      expect(untranslated).toEqual([]);
    }
  });
});

describe("translation", () => {
  it("interpolates", () => {
    expect(translator("en")("search.resultsCount", { count: 27 })).toBe("We found 27 homes");
    expect(translator("sw")("search.resultsCount", { count: 27 })).toContain("27");
    expect(translator("rw")("search.resultsCount", { count: 27 })).toContain("27");
  });

  it("returns the key rather than an empty string when one is missing", () => {
    expect(translator("en")("nothing.here")).toBe("nothing.here");
  });

  it("leaves an unmatched placeholder alone rather than printing undefined", () => {
    expect(translator("en")("account.memberUntil")).toContain("{date}");
  });
});

describe("locale resolution", () => {
  it("reads the browser's preference", () => {
    expect(localeFromAcceptLanguage("rw-RW,rw;q=0.9,en;q=0.8")).toBe("rw");
    expect(localeFromAcceptLanguage("en-GB,en;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("sw-TZ")).toBe("sw");
  });

  it("falls back to Swahili for anything else", () => {
    expect(localeFromAcceptLanguage("fr-FR,de;q=0.8")).toBe("sw");
    expect(localeFromAcceptLanguage(null)).toBe("sw");
  });

  it("validates a stored choice", () => {
    expect(isLocale("sw")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("the WhatsApp phrasebook", () => {
  it("carries all three languages for every phrase", () => {
    for (const [key, translations] of Object.entries(PHRASES)) {
      for (const locale of LOCALES) {
        expect(translations[locale], `${key}.${locale}`).toBeTruthy();
      }
    }
  });

  it("interpolates the count into all three", () => {
    for (const locale of LOCALES) {
      expect(phrase("foundCount", locale, { count: 8 })).toContain("8");
    }
  });

  it("guesses the language from what the tenant wrote", () => {
    expect(detectLocale("Habari, natafuta nyumba")).toBe("sw");
    expect(detectLocale("Muraho, nshaka inzu")).toBe("rw");
    expect(detectLocale("Hi, I need a 2 bedroom")).toBe("en");
    expect(detectLocale("....")).toBeNull();
  });
});
