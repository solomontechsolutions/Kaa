"use client";

import { Check, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function persist(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Language switcher.
 *
 * The choice is a cookie, so it survives a reload, applies to every surface
 * on the deployment, and does not fork the URL space. `router.refresh()` is
 * what re-renders the Server Components with the new dictionary; there is no
 * client-side translation state to keep in sync.
 */
export function LanguageSwitcher({
  current,
  className,
  variant = "menu",
}: {
  current: Locale;
  className?: string;
  /** `menu` is a popover for headers; `list` is a full-width settings list. */
  variant?: "menu" | "list";
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Locale | null>(null);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(locale: Locale) {
    setPending(locale);
    persist(locale);
    setOpen(false);
    router.refresh();
    // The refresh resolves asynchronously; clearing on the next tick keeps the
    // tick mark on the new choice rather than flashing back.
    setTimeout(() => setPending(null), 600);
  }

  if (variant === "list") {
    return (
      <ul className={cn("space-y-2", className)}>
        {LOCALES.map((locale) => {
          const active = (pending ?? current) === locale;
          return (
            <li key={locale}>
              <button
                type="button"
                onClick={() => choose(locale)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-kaa-400 bg-kaa-50 dark:border-kaa-700 dark:bg-kaa-950/60"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                <span className="text-lg leading-none">{LOCALE_NAMES[locale].flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{LOCALE_NAMES[locale].native}</span>
                  <span className="block text-xs text-foreground-subtle">{LOCALE_NAMES[locale].english}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-kaa-600 dark:text-kaa-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        <Globe className="size-4" />
        <span className="uppercase">{current}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-52 overflow-hidden rounded-2xl border border-border bg-surface-raised p-1.5 shadow-[var(--shadow-elev-3)]"
        >
          {LOCALES.map((locale) => {
            const active = (pending ?? current) === locale;
            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(locale)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  active ? "bg-kaa-50 text-kaa-800 dark:bg-kaa-950/60 dark:text-kaa-300" : "hover:bg-surface",
                )}
              >
                <span className="leading-none">{LOCALE_NAMES[locale].flag}</span>
                <span className="flex-1 font-medium">{LOCALE_NAMES[locale].native}</span>
                {active && <Check className="size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
