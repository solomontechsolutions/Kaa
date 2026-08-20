"use client";

import { ArrowRight, Loader2, Lock, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { PropertyCard } from "@/components/app/property-card";
import { Button } from "@/components/ui";
import type { PropertyView } from "@/lib/access/redact";
import type { Suggestion } from "@/lib/search/service";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SearchResponse {
  count: number;
  access: "anonymous" | "free" | "member";
  results: PropertyView[];
  suggestions: Suggestion[];
  criteria: {
    location?: string;
    bedrooms?: number;
    maxRent?: number;
    amenities: string[];
  };
}

const BUDGETS = [300_000, 500_000, 700_000, 1_000_000, 2_000_000];
const BEDROOMS = [1, 2, 3, 4];

/**
 * Search, actually interactive.
 *
 * Everything on this screen does something: the field takes typing, the chips
 * toggle, the filter sheet opens, and every change re-runs the real search.
 * The previous build rendered the same controls as `<span>` and `<div>`, which
 * looked identical and responded to nothing — that is what "some things are
 * not clickable" was.
 *
 * The count comes back from the server and is shown to everyone, member or
 * not. What changes with membership is what arrives in `results`.
 */
export function SearchExperience({
  locale,
  wards,
  amenities,
  initialQuery,
}: {
  locale: Locale;
  wards: string[];
  amenities: { slug: string; label: string }[];
  initialQuery?: string;
}) {
  const t = React.useMemo(() => translator(locale), [locale]);

  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [location, setLocation] = React.useState<string | undefined>();
  const [bedrooms, setBedrooms] = React.useState<number | undefined>();
  const [maxRent, setMaxRent] = React.useState<number | undefined>();
  const [chosenAmenities, setChosenAmenities] = React.useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const [data, setData] = React.useState<SearchResponse | null>(null);
  const [busy, setBusy] = React.useState(true);

  const run = React.useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: query || undefined,
          location,
          bedrooms,
          maxRent,
          amenities: chosenAmenities,
        }),
      });
      setData(await response.json());
    } catch {
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [query, location, bedrooms, maxRent, chosenAmenities]);

  // Debounced so typing does not fire a request per keystroke.
  React.useEffect(() => {
    const timer = setTimeout(run, query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [run, query]);

  const isMember = data?.access === "member";
  const hasFilters = Boolean(location || bedrooms || maxRent || chosenAmenities.length);

  function toggleAmenity(slug: string) {
    setChosenAmenities((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }

  function clearAll() {
    setLocation(undefined);
    setBedrooms(undefined);
    setMaxRent(undefined);
    setChosenAmenities([]);
    setQuery("");
  }

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 focus-within:border-kaa-400">
            <Search className="size-4 shrink-0 text-foreground-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("common.search")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-subtle"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={t("search.clear")}>
                <X className="size-4 text-foreground-subtle" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={t("search.filters")}
            aria-expanded={filtersOpen}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl border text-foreground-muted transition-colors",
              hasFilters ? "border-kaa-400 bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400" : "border-border bg-surface",
            )}
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {wards.map((ward) => (
            <button
              key={ward}
              type="button"
              onClick={() => setLocation((current) => (current === ward ? undefined : ward))}
              aria-pressed={location === ward}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
                location === ward
                  ? "border-kaa-400 bg-kaa-500 text-ink-950"
                  : "border-border bg-surface text-foreground-muted",
              )}
            >
              {ward}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 pb-3 pt-2">
        {busy ? (
          <p className="flex items-center gap-2 text-xs text-foreground-subtle">
            <Loader2 className="size-3.5 animate-spin" />
            {t("search.searching")}
          </p>
        ) : data ? (
          <p className="text-sm font-medium">
            {data.count === 1 ? t("search.resultsCountOne") : t("search.resultsCount", { count: data.count })}
          </p>
        ) : null}
      </div>

      {data && data.count === 0 && !busy && (
        <NoResults t={t} suggestions={data.suggestions} onApply={(next) => {
          if (next.kind === "raise_budget") setMaxRent(next.toAmount);
          if (next.kind === "nearby_ward") setLocation(next.ward);
          if (next.kind === "drop_amenity") toggleAmenity(next.amenity);
          if (next.kind === "any_bedrooms") setBedrooms(undefined);
        }} />
      )}

      {data && data.count > 0 && !isMember && <Paywall t={t} count={data.count} />}

      <ul className="space-y-3 px-5">
        {data?.results.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} photosLockedLabel={t("paywall.photosLocked")} />
          </li>
        ))}
      </ul>

      {filtersOpen && (
        <FilterSheet
          t={t}
          amenities={amenities}
          bedrooms={bedrooms}
          maxRent={maxRent}
          chosen={chosenAmenities}
          onBedrooms={setBedrooms}
          onMaxRent={setMaxRent}
          onToggleAmenity={toggleAmenity}
          onClear={clearAll}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}

function Paywall({ t, count }: { t: (key: string, values?: Record<string, string | number>) => string; count: number }) {
  return (
    <div className="mx-5 mb-4 rounded-2xl border border-kaa-200 bg-kaa-50 p-5 dark:border-kaa-800 dark:bg-kaa-950/50">
      <span className="flex size-10 items-center justify-center rounded-xl bg-kaa-500/15 text-kaa-700 dark:text-kaa-400">
        <Lock className="size-4.5" />
      </span>
      <p className="mt-3.5 font-semibold tracking-tight">{t("paywall.lockedTitle", { count })}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{t("paywall.lockedBody")}</p>
      <p className="tnum mt-3 text-lg font-semibold text-kaa-700 dark:text-kaa-400">{t("paywall.price")}</p>
      <Link
        href="/app/unlock"
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-kaa-500 text-sm font-medium text-ink-950 active:scale-[0.98]"
      >
        {t("paywall.unlock")}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function NoResults({
  t,
  suggestions,
  onApply,
}: {
  t: (key: string, values?: Record<string, string | number>) => string;
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
}) {
  return (
    <div className="mx-5 mb-4 rounded-2xl border border-border bg-surface p-5">
      <p className="font-medium">{t("search.noResults")}</p>
      {suggestions.length > 0 && (
        <>
          <p className="mt-3 text-sm text-foreground-muted">{t("search.noResultsHelp")}</p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onApply(suggestion)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised px-3.5 py-3 text-left text-sm transition-colors active:border-kaa-300"
                >
                  <span>{describe(suggestion, t)}</span>
                  <span className="tnum shrink-0 text-xs font-medium text-kaa-700 dark:text-kaa-400">
                    {suggestion.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function describe(suggestion: Suggestion, t: (key: string) => string) {
  switch (suggestion.kind) {
    case "raise_budget":
      return `${t("search.suggestBudget")} — ${money(suggestion.toAmount)}`;
    case "nearby_ward":
      return `${t("search.suggestNearby")} — ${suggestion.ward}`;
    case "drop_amenity":
      return `${t("search.suggestAmenity")} — ${suggestion.amenity.replace(/_/g, " ")}`;
    case "any_bedrooms":
      return t("search.suggestSimilar");
  }
}

function FilterSheet({
  t,
  amenities,
  bedrooms,
  maxRent,
  chosen,
  onBedrooms,
  onMaxRent,
  onToggleAmenity,
  onClear,
  onClose,
}: {
  t: (key: string) => string;
  amenities: { slug: string; label: string }[];
  bedrooms?: number;
  maxRent?: number;
  chosen: string[];
  onBedrooms: (value: number | undefined) => void;
  onMaxRent: (value: number | undefined) => void;
  onToggleAmenity: (slug: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label={t("common.cancel")} onClick={onClose} className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm" />

      <div className="relative max-h-[82dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border-strong" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t("search.filters")}</h2>
          <button type="button" onClick={onClear} className="text-sm font-medium text-kaa-700 dark:text-kaa-400">
            {t("search.clear")}
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">{t("common.bedrooms")}</legend>
          <div className="mt-3 flex gap-2">
            <Chip active={bedrooms === undefined} onClick={() => onBedrooms(undefined)}>
              {t("search.anyBedrooms")}
            </Chip>
            {BEDROOMS.map((count) => (
              <Chip key={count} active={bedrooms === count} onClick={() => onBedrooms(count)}>
                {count}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">{t("listing.rent")}</legend>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <Chip active={maxRent === undefined} onClick={() => onMaxRent(undefined)}>
              {t("search.anyBudget")}
            </Chip>
            {BUDGETS.map((amount) => (
              <Chip key={amount} active={maxRent === amount} onClick={() => onMaxRent(amount)}>
                {money(amount)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">{t("listing.amenities")}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <Chip
                key={amenity.slug}
                active={chosen.includes(amenity.slug)}
                onClick={() => onToggleAmenity(amenity.slug)}
              >
                {amenity.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Button size="lg" className="mt-8 w-full" onClick={onClose}>
          {t("search.apply")}
        </Button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
        active
          ? "border-kaa-400 bg-kaa-500 text-ink-950"
          : "border-border bg-surface text-foreground-muted",
      )}
    >
      {children}
    </button>
  );
}
