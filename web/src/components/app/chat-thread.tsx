"use client";

import { Loader2, Lock, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { KaaMark } from "@/components/brand/logo";
import type { PropertyView } from "@/lib/access/redact";
import type { Suggestion } from "@/lib/search/service";
import { money } from "@/lib/format";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

interface Turn {
  from: "bot" | "user";
  text: string;
  count?: number;
  locked?: boolean;
  results?: PropertyView[];
  suggestions?: Suggestion[];
}

/**
 * The in-app assistant.
 *
 * It is the same conversation the WhatsApp bot has, against the same search
 * service and the same paywall — the transport is the only difference. A free
 * user gets the genuine count and an unlock prompt here exactly as they do in
 * WhatsApp, because both call `/api/search` and both receive whatever
 * `viewsFor` decided they are entitled to.
 */
export function ChatThread({ locale }: { locale: Locale }) {
  const t = React.useMemo(() => translator(locale), [locale]);

  const [turns, setTurns] = React.useState<Turn[]>([
    { from: "bot", text: t("chat.greeting") },
    { from: "bot", text: t("chat.example") },
  ]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    setTurns((current) => [...current, { from: "user", text }]);
    setDraft("");
    setBusy(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: text, limit: 5 }),
      });
      const payload = await response.json();

      if (payload.count === 0) {
        setTurns((current) => [
          ...current,
          { from: "bot", text: t("search.noResults"), suggestions: payload.suggestions },
        ]);
      } else {
        setTurns((current) => [
          ...current,
          {
            from: "bot",
            text:
              payload.count === 1
                ? t("search.resultsCountOne")
                : t("search.resultsCount", { count: payload.count }),
            count: payload.count,
            locked: payload.access !== "member",
            results: payload.results,
          },
        ]);
      }
    } catch {
      setTurns((current) => [...current, { from: "bot", text: t("common.somethingWentWrong") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <span className="flex size-10 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
          <KaaMark className="size-6" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">{t("chat.title")}</p>
          <p className="text-xs text-kaa-700 dark:text-kaa-400">{t("chat.online")}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-foreground-subtle">
          <MessageCircle className="size-3.5" />
          {t("chat.alsoOnWhatsApp")}
        </span>
      </header>

      <ul className="flex-1 space-y-2.5 px-5 py-4">
        {turns.map((turn, index) => (
          <li key={index} className={turn.from === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                turn.from === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-kaa-500 px-3.5 py-2.5 text-sm text-ink-950"
                  : "max-w-[88%] rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-sm"
              }
            >
              <p className="whitespace-pre-line">{turn.text}</p>

              {turn.locked && (
                <div className="mt-3 rounded-xl border border-kaa-200 bg-kaa-50 p-3 dark:border-kaa-800 dark:bg-kaa-950/60">
                  <p className="flex items-center gap-1.5 text-xs font-medium">
                    <Lock className="size-3.5" />
                    {t("paywall.lockedBody")}
                  </p>
                  <p className="tnum mt-1.5 text-sm font-semibold text-kaa-700 dark:text-kaa-400">
                    {t("paywall.price")}
                  </p>
                  <Link
                    href="/app/unlock"
                    className="mt-2.5 flex h-9 items-center justify-center rounded-lg bg-kaa-500 text-xs font-medium text-ink-950"
                  >
                    {t("paywall.unlock")}
                  </Link>
                </div>
              )}

              {turn.results && !turn.locked && (
                <ul className="mt-3 space-y-2">
                  {turn.results.map((property) =>
                    property.access === "full" ? (
                      <li key={property.id}>
                        <Link
                          href={`/app/listing/${property.id}`}
                          className="block rounded-xl border border-border bg-background p-3"
                        >
                          <p className="text-xs font-semibold">{property.headline}</p>
                          <p className="text-xs text-foreground-subtle">{property.ward}</p>
                          <p className="tnum mt-1 text-xs font-medium text-kaa-700 dark:text-kaa-400">
                            {money(property.rentAmount)} {t("common.perMonth")}
                          </p>
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}

              {turn.suggestions && turn.suggestions.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-xs text-foreground-muted">
                  {turn.suggestions.map((suggestion, i) => (
                    <li key={i}>• {describe(suggestion)}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}

        {busy && (
          <li className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5">
              <Loader2 className="size-4 animate-spin text-foreground-subtle" />
            </div>
          </li>
        )}
        <div ref={endRef} />
      </ul>

      <form
        onSubmit={send}
        className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("chat.placeholder")}
          aria-label={t("chat.placeholder")}
          className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none transition-colors focus:border-kaa-400"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label={t("chat.send")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-kaa-500 text-ink-950 transition-transform active:scale-95 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function describe(suggestion: Suggestion) {
  switch (suggestion.kind) {
    case "raise_budget":
      return `Raise the budget to ${money(suggestion.toAmount)} — ${suggestion.count} available`;
    case "nearby_ward":
      return `Try ${suggestion.ward} — ${suggestion.count} available`;
    case "drop_amenity":
      return `Drop ${suggestion.amenity.replace(/_/g, " ")} — ${suggestion.count} available`;
    case "any_bedrooms":
      return `Any number of bedrooms — ${suggestion.count} available`;
  }
}
