import { Bath, BedDouble, Lock, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import type { PropertyView } from "@/lib/access/redact";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One home in a list.
 *
 * The card is driven entirely by the shape it is handed. A preview simply does
 * not carry a photo path, a building name or an exact rent, so there is
 * nothing here to un-hide — no blur filter, no `hidden` class, nothing a
 * console can reach. That is deliberate: blurring a photo still ships the
 * photo, and a tenant who can name the building can go around Kaa.
 */
export function PropertyCard({
  property,
  photosLockedLabel,
  className,
}: {
  property: PropertyView;
  photosLockedLabel: string;
  className?: string;
}) {
  const href = property.access === "full" ? `/app/listing/${property.id}` : `/app/listing/${property.id}`;

  return (
    <Link
      href={href}
      className={cn(
        "block overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors active:border-kaa-300",
        className,
      )}
    >
      <div className="relative">
        {property.access === "full" ? (
          <>
            <Thumb seed={property.id} className="h-44 w-full rounded-none" />
            <div className="absolute left-3 top-3">
              <Badge tone="brand" className="bg-white/95 backdrop-blur dark:bg-ink-900/95">
                <ShieldCheck />
                Kaa
              </Badge>
            </div>
          </>
        ) : (
          <LockedPhoto label={photosLockedLabel} />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">
              {property.access === "full"
                ? `${property.propertyName}, ${property.label}`
                : property.headline}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
              <MapPin className="size-3 shrink-0" />
              {property.ward}
            </p>
          </div>
          <p className="tnum shrink-0 text-sm font-semibold text-kaa-700 dark:text-kaa-400">
            {property.access === "full" ? money(property.rentAmount) : `${money(property.rentFrom)}+`}
          </p>
        </div>

        <div className="mt-2.5 flex items-center gap-4 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="size-3.5" />
            <span className="tnum">{property.bedrooms}</span>
          </span>
          {property.access === "full" && (
            <>
              <span className="inline-flex items-center gap-1">
                <Bath className="size-3.5" />
                <span className="tnum">{property.bathrooms}</span>
              </span>
              <span className="tnum ml-auto">{property.advanceMonths} months upfront</span>
            </>
          )}
          {property.access === "preview" && (
            <span className="tnum ml-auto">{property.amenityCount} amenities</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * The locked photo state. A proper empty frame, not a blurred photograph —
 * a blur is a client-side effect over bytes that were still sent.
 */
export function LockedPhoto({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-44 w-full flex-col items-center justify-center gap-2 bg-surface",
        "bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(0,200,154,0.045)_10px,rgba(0,200,154,0.045)_20px)]",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-surface-raised text-foreground-subtle shadow-[var(--shadow-elev-1)]">
        <Lock className="size-4.5" />
      </span>
      <p className="px-6 text-center text-xs font-medium text-foreground-subtle">{label}</p>
    </div>
  );
}
