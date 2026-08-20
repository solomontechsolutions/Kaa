import { ArrowRight, BedDouble, Bath, MapPin, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { KaaMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { listUnits } from "@/lib/data/queries";
import { money } from "@/lib/format";

export default function AppHomePage() {
  const live = listUnits().filter((unit) => unit.listingState === "live");
  const featured = live[0];
  const rest = live.slice(1);

  const wards = [...new Set(live.map((unit) => unit.property.ward))];

  return (
    <div className="pb-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KaaMark className="size-8 text-kaa-500" gradient id="app-home" />
            <div>
              <p className="text-xs text-foreground-subtle">Karibu</p>
              <p className="text-sm font-semibold leading-tight">Find your place</p>
            </div>
          </div>
          <span className="flex size-9 items-center justify-center rounded-full bg-surface text-foreground-muted">
            <SlidersHorizontal className="size-4" />
          </span>
        </div>

        <Link
          href="/app/search"
          className="mt-4 flex h-12 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm text-foreground-subtle"
        >
          <Search className="size-4 shrink-0" />
          Search a ward, or a budget
        </Link>
      </header>

      {/* ── Ward chips ──────────────────────────────────────────── */}
      <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto px-5 pb-4">
        {wards.map((ward) => (
          <span
            key={ward}
            className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium"
          >
            {ward}
          </span>
        ))}
      </div>

      {/* ── Featured ────────────────────────────────────────────── */}
      {featured && (
        <section className="px-5">
          <Link href={`/app/listing/${featured.id}`} className="block">
            <article className="overflow-hidden rounded-3xl border border-border bg-surface-raised shadow-[var(--shadow-elev-2)]">
              <div className="relative">
                <Thumb seed={featured.id} className="h-56 w-full rounded-none" />
                <div className="absolute left-3 top-3">
                  <Badge tone="brand" className="bg-white/95 backdrop-blur dark:bg-ink-900/95">
                    <ShieldCheck />
                    Visited by Kaa
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold tracking-tight">
                      {featured.property.name}, {featured.label}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                      <MapPin className="size-3 shrink-0" />
                      {featured.property.ward}, {featured.property.district}
                    </p>
                  </div>
                  <p className="tnum shrink-0 font-semibold text-kaa-700 dark:text-kaa-400">
                    {money(featured.rentAmount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="size-3.5" />
                    <span className="tnum">{featured.bedrooms}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="size-3.5" />
                    <span className="tnum">{featured.bathrooms}</span>
                  </span>
                  <span className="tnum">{featured.advanceMonths} months upfront</span>
                </div>
              </div>
            </article>
          </Link>
        </section>
      )}

      {/* ── Feed ────────────────────────────────────────────────── */}
      <section className="mt-7 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Available now
          </h2>
          <Link
            href="/app/search"
            className="inline-flex items-center gap-1 text-xs font-medium text-kaa-700 dark:text-kaa-400"
          >
            See all <ArrowRight className="size-3" />
          </Link>
        </div>

        <ul className="space-y-3">
          {rest.map((unit) => (
            <li key={unit.id}>
              <Link href={`/app/listing/${unit.id}`} className="flex gap-3.5 rounded-2xl border border-border bg-surface-raised p-3">
                <Thumb seed={unit.id} className="size-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {unit.property.name}, {unit.label}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-foreground-subtle">
                    {unit.property.ward}, {unit.property.district}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="size-3.5" />
                      <span className="tnum">{unit.bedrooms}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="size-3.5" />
                      <span className="tnum">{unit.bathrooms}</span>
                    </span>
                  </div>
                  <p className="tnum mt-2 text-sm font-semibold text-kaa-700 dark:text-kaa-400">
                    {money(unit.rentAmount)}
                    <span className="text-xs font-normal text-foreground-subtle"> / month</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
