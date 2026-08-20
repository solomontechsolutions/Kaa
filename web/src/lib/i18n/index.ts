/**
 * Translation lookup.
 *
 * `t("search.resultsCount", { count: 7 })` — dotted key, `{name}` placeholders.
 * A missing key returns the key itself rather than an empty string, so a gap
 * is visible in review instead of silently blank on a tenant's phone.
 */

import { DEFAULT_LOCALE, type Locale } from "./config";
import { dictionaries, type Dictionary } from "./dictionaries";

type Values = Record<string, string | number>;

function resolve(dict: Dictionary, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

function interpolate(template: string, values?: Values) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export type Translate = (key: string, values?: Values) => string;

/** Translator for one locale, falling back to Swahili then the key. */
export function translator(locale: Locale): Translate {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const fallback = dictionaries[DEFAULT_LOCALE];
  return (key, values) => {
    const template = resolve(dict, key) ?? resolve(fallback, key) ?? key;
    return interpolate(template, values);
  };
}

export { dictionaries };
export type { Dictionary };
export * from "./config";
