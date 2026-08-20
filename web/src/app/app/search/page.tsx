import { Bath, BedDouble, MapPin, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { listUnits, wards } from "@/lib/data/queries";
import { money } from "@/lib/format";

export const metadata = { title: "Search" };

export default function AppSearchPage() {
  const live = listUnits().filter((unit) => unit.listingState === "live");
  const districts = [...new Set(wards.map((ward) => ward.district))];

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-12 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm text-foreground-subtle">
            <Search className="size-4 shrink-0" />
            Ward, budget, or amenity
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-foreground-muted">
            <SlidersHorizontal className="size-4" />
          </span>
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {districts.map((district) => (
            <span
              key={district}
              className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium"
            >
              {district}
            </span>
          ))}
        </div>
      </header>

      <p className="px-5 pb-3 pt-2 text-xs text-foreground-subtle">
        <span className="tnum">{live.length}</span> verified homes available
      </p>

      <ul className="space-y-3 px-5">
        {live.map((unit) => (
          <li key={unit.id}>
            <Link
              href={`/app/listing/${unit.id}`}
              className="block overflow-hidden rounded-2xl border border-border bg-surface-raised"
            >
              <div className="relative">
                <Thumb seed={unit.id} className="h-44 w-full rounded-none" />
                <div className="absolute left-3 top-3">
                  <Badge tone="brand" className="bg-white/95 backdrop-blur dark:bg-ink-900/95">
                    Verified
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {unit.property.name}, {unit.label}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                      <MapPin className="size-3 shrink-0" />
                      {unit.property.ward}
                    </p>
                  </div>
                  <p className="tnum shrink-0 text-sm font-semibold text-kaa-700 dark:text-kaa-400">
                    {money(unit.rentAmount)}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center gap-4 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="size-3.5" />
                    <span className="tnum">{unit.bedrooms}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Bath className="size-3.5" />
                    <span className="tnum">{unit.bathrooms}</span>
                  </span>
                  <span className="tnum ml-auto">{unit.advanceMonths} months upfront</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
