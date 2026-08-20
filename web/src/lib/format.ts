/**
 * Tanzanian formatting helpers.
 * Money is always TZS; the platform never displays bare numbers for rent.
 */

const TZS = new Intl.NumberFormat("en-TZ", {
  style: "currency",
  currency: "TZS",
  maximumFractionDigits: 0,
});

const TZS_COMPACT = new Intl.NumberFormat("en-TZ", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** `TSh 650,000` */
export function money(amount: number) {
  return TZS.format(amount).replace("TZS", "TSh");
}

/** `TSh 1.2M` — for dashboard tiles where space is tight. */
export function moneyCompact(amount: number) {
  return `TSh ${TZS_COMPACT.format(amount)}`;
}

/** `TSh 650,000 / month` */
export function rent(amount: number, per: "month" | "year" = "month") {
  return `${money(amount)} / ${per}`;
}

export function percent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATETIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function date(value: string | Date) {
  return DATE.format(typeof value === "string" ? new Date(value) : value);
}

export function dateTime(value: string | Date) {
  return DATETIME.format(typeof value === "string" ? new Date(value) : value);
}

/** `3 days ago`, `in 2 months` — relative to now. */
export function relative(value: string | Date) {
  const then = typeof value === "string" ? new Date(value) : value;
  const diff = then.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

/**
 * Normalises Tanzanian mobile numbers to E.164 (+255…).
 * Accepts `0784…`, `255784…`, `+255 784 …`.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return `+255${digits.slice(1)}`;
  if (/^255\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\d{9}$/.test(digits)) return `+255${digits}`;
  return null;
}

/** `+255 784 000 500` */
export function displayPhone(e164: string) {
  const m = /^\+255(\d{3})(\d{3})(\d{3})$/.exec(e164);
  return m ? `+255 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** Mobile-money provider inferred from a TZ prefix. */
export function mnoFor(e164: string): "M-Pesa" | "Tigo Pesa" | "Airtel Money" | "Halopesa" | "Unknown" {
  const p = e164.replace("+255", "").slice(0, 2);
  if (["74", "75", "76"].includes(p)) return "M-Pesa";
  if (["71", "65", "67", "77"].includes(p)) return "Tigo Pesa";
  if (["68", "69", "78"].includes(p)) return "Airtel Money";
  if (["62", "61"].includes(p)) return "Halopesa";
  return "Unknown";
}
