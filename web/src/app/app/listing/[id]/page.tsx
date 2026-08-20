import {
  ArrowLeft,
  Banknote,
  Bath,
  BedDouble,
  Bookmark,
  Building2,
  Crosshair,
  Fingerprint,
  Maximize,
  Plug,
  Share2,
  ShieldCheck,
  Sofa,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { KaaMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { amenityLabels } from "@/lib/data/seed";
import { getUnit, unitsForProperty } from "@/lib/data/queries";
import { money } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/app/listing/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const unit = getUnit(id);
  return { title: unit ? `${unit.property.name}, ${unit.label}` : "Listing" };
}

export default async function ListingPage(props: PageProps<"/app/listing/[id]">) {
  const { id } = await props.params;
  const unit = getUnit(id);
  if (!unit) notFound();

  // Other units in the same building, shown the way the reference app groups
  // rooms: one card per lettable space, each with its own terms.
  const siblings = unitsForProperty(unit.propertyId).filter(
    (other) => other.id !== unit.id && other.status === "available",
  );

  const moveIn = unit.rentAmount * unit.advanceMonths + unit.rentAmount * unit.depositMonths;

  return (
    <div className="pb-32">
      {/* ── Photo header ────────────────────────────────────────── */}
      <div className="relative">
        <Thumb seed={unit.id} className="h-[19rem] w-full rounded-none" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <Link
            href="/app"
            aria-label="Back"
            className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-elev-1)] backdrop-blur"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Share"
              className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-elev-1)] backdrop-blur"
            >
              <Share2 className="size-4.5" />
            </button>
            <button
              type="button"
              aria-label="Save"
              className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-elev-1)] backdrop-blur"
            >
              <Bookmark className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Carousel position, as the reference shows it */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={
                dot === 0
                  ? "h-1.5 w-5 rounded-full bg-white shadow-sm"
                  : "size-1.5 rounded-full bg-white/60 shadow-sm"
              }
            />
          ))}
        </div>
      </div>

      {/* ── Sheet ───────────────────────────────────────────────── */}
      <div className="relative -mt-6 rounded-t-[1.75rem] bg-background px-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold leading-snug tracking-tight">
              {unit.property.name}, {unit.label}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {unit.property.ward}, {unit.property.district}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum text-xl font-semibold text-kaa-700 dark:text-kaa-400">
              {money(unit.rentAmount)}
            </p>
            <p className="text-xs text-foreground-subtle">per month</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="brand">
            <ShieldCheck />
            Visited by Kaa
          </Badge>
          <Badge tone="outline">
            <Crosshair />
            Pinned <span className="tnum">±3.9 m</span>
          </Badge>
        </div>

        {/* ── Move-in cost, stated before anyone travels ────────── */}
        <div className="mt-5 rounded-2xl border border-kaa-200 bg-kaa-50 p-4 dark:border-kaa-900 dark:bg-kaa-950/60">
          <p className="text-xs font-medium uppercase tracking-wider text-kaa-800 dark:text-kaa-300">
            To move in
          </p>
          <p className="tnum mt-1.5 text-2xl font-semibold text-kaa-900 dark:text-kaa-200">
            {money(moveIn)}
          </p>
          <p className="tnum mt-1 text-xs text-kaa-800/80 dark:text-kaa-300/80">
            {unit.advanceMonths} months upfront plus {unit.depositMonths} month deposit
          </p>
        </div>

        {/* ── Listing details, one card per lettable space ──────── */}
        <section className="mt-7">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Listing details
          </h2>

          <div className="mt-4 space-y-3">
            <RoomCard
              label={unit.label}
              rent={unit.rentAmount}
              deposit={unit.rentAmount * unit.depositMonths}
              bedrooms={unit.bedrooms}
              bathrooms={unit.bathrooms}
              sizeSqm={unit.sizeSqm}
              furnishing={unit.furnishing}
              primary
            />
            {siblings.map((other) => (
              <RoomCard
                key={other.id}
                label={other.label}
                rent={other.rentAmount}
                deposit={other.rentAmount * other.depositMonths}
                bedrooms={other.bedrooms}
                bathrooms={other.bathrooms}
                sizeSqm={other.sizeSqm}
                furnishing={other.furnishing}
                href={`/app/listing/${other.id}`}
              />
            ))}
          </div>
        </section>

        {/* ── Amenities ─────────────────────────────────────────── */}
        {unit.amenities.length > 0 && (
          <section className="mt-7">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              What is here
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {unit.amenities.map((slug) => (
                <span
                  key={slug}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                >
                  {amenityLabels[slug]?.en ?? slug}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── About ─────────────────────────────────────────────── */}
        {unit.property.description && (
          <section className="mt-7">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              About the property
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {unit.property.description}
            </p>
            {unit.property.landmark && (
              <p className="mt-2 text-sm text-foreground-subtle">{unit.property.landmark}</p>
            )}
          </section>
        )}

        {/* ── Location ──────────────────────────────────────────── */}
        <section className="mt-7">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Location
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border">
            <MapPlaceholder />
            <div className="flex items-center justify-between gap-3 bg-surface-raised px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{unit.property.addressLine}</p>
                <p className="tnum text-xs text-foreground-subtle">
                  {unit.property.latitude.toFixed(4)}, {unit.property.longitude.toFixed(4)}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${unit.property.latitude},${unit.property.longitude}`}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </section>

        {/* ── Managed by ────────────────────────────────────────── */}
        <section className="mt-7 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kaa-500 text-ink-950">
              <KaaMark className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Managed by Kaa Field Ops</p>
              <p className="text-xs text-foreground-subtle">
                Visited, photographed and let by our own agents
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 border-t border-border pt-3">
            <Assurance icon={<Fingerprint />}>
              Your <span className="tnum">20</span> digit NIDA is checked before viewing
            </Assurance>
            <Assurance icon={<Wallet />}>No dalali fee and no viewing fee</Assurance>
            <Assurance icon={<Building2 />}>A digital contract, witnessed, at the end of it</Assurance>
          </ul>
        </section>
      </div>

      {/* ── Apply bar ───────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 px-5">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-surface-raised/95 p-2.5 shadow-[var(--shadow-elev-3)] backdrop-blur-xl">
          <div className="min-w-0 pl-2">
            <p className="tnum text-sm font-semibold leading-tight">{money(unit.rentAmount)}</p>
            <p className="text-[0.7rem] text-foreground-subtle">per month</p>
          </div>
          <Link
            href={`/app/listing/${unit.id}/apply`}
            className="ml-auto flex h-11 flex-1 items-center justify-center rounded-xl bg-kaa-500 px-5 text-sm font-semibold text-ink-950 transition-colors active:bg-kaa-600"
          >
            Apply for this home
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  label,
  rent,
  deposit,
  bedrooms,
  bathrooms,
  sizeSqm,
  furnishing,
  primary,
  href,
}: {
  label: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  furnishing: string;
  primary?: boolean;
  href?: string;
}) {
  const rows = [
    { icon: <Banknote />, label: "Rent", value: money(rent) },
    { icon: <Wallet />, label: "Deposit", value: money(deposit) },
    { icon: <Plug />, label: "Bills", value: "Not included" },
    { icon: <BedDouble />, label: "Bedrooms", value: String(bedrooms) },
    { icon: <Bath />, label: "Bathrooms", value: String(bathrooms) },
    ...(sizeSqm ? [{ icon: <Maximize />, label: "Size", value: `${sizeSqm} m²` }] : []),
    { icon: <Sofa />, label: "Furnishing", value: furnishing.replace(/_/g, " "), capitalize: true },
  ];

  const body = (
    <div
      className={
        primary
          ? "rounded-2xl border border-kaa-300 bg-surface-raised p-4 dark:border-kaa-800"
          : "rounded-2xl border border-border bg-surface-raised p-4"
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold tracking-tight">{label}</p>
        {primary ? (
          <Badge tone="brand">This unit</Badge>
        ) : (
          <Badge tone="outline">Also available</Badge>
        )}
      </div>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-3.5">
              {row.icon}
            </span>
            <dt className="text-foreground-muted">{row.label}</dt>
            <dd className={`tnum ml-auto font-medium${"capitalize" in row && row.capitalize ? " capitalize" : ""}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function Assurance({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-xs text-foreground-muted">
      <span className="text-kaa-600 dark:text-kaa-400 [&_svg]:size-3.5">{icon}</span>
      {children}
    </li>
  );
}

/** A drawn street grid. Replaced by a real map once tiles are wired up. */
function MapPlaceholder() {
  return (
    <div className="relative h-40 w-full bg-[#E8EDE9] dark:bg-[#16211C]" aria-hidden="true">
      <svg viewBox="0 0 320 160" className="size-full" preserveAspectRatio="xMidYMid slice">
        <g stroke="currentColor" className="text-ink-300 dark:text-ink-700" strokeWidth="8" fill="none">
          <path d="M-10 60 H330" />
          <path d="M-10 118 H330" />
          <path d="M70 -10 V170" />
          <path d="M210 -10 V170" />
        </g>
        <g stroke="currentColor" className="text-ink-200 dark:text-ink-800" strokeWidth="3" fill="none">
          <path d="M-10 30 H330" />
          <path d="M140 -10 V170" />
          <path d="M270 -10 V170" />
        </g>
        <circle cx="160" cy="88" r="16" className="fill-kaa-500/25" />
        <circle cx="160" cy="88" r="7" className="fill-kaa-500" />
        <circle cx="160" cy="88" r="2.5" className="fill-white" />
      </svg>
    </div>
  );
}
