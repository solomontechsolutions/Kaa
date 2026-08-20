import {
  ArrowLeft,
  Banknote,
  Bath,
  BedDouble,
  Building2,
  Crosshair,
  Lock,
  Maximize,
  ShieldCheck,
  Sofa,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LockedPhoto } from "@/components/app/property-card";
import { SaveButton } from "@/components/app/save-button";
import { ViewingButton } from "@/components/app/viewing-button";
import { Badge, ButtonLink } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { currentEntitlement } from "@/lib/access/session";
import { viewFor } from "@/lib/access/redact";
import { isSaved } from "@/lib/accounts/store";
import { getLiveUnit } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { money } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const unit = getLiveUnit(id);
  // The title is the same for everyone, so it stays a type rather than a name.
  return { title: unit ? `${unit.bedrooms} bedroom, ${unit.property.ward}` : "Listing" };
}

/**
 * One home.
 *
 * The page renders whatever `viewFor` produced. For a free user that is the
 * preview shape, which carries no photograph, no address, no coordinate and
 * no landlord — so the locked sections below are not hiding data that was
 * sent anyway. There is nothing in the HTML to recover.
 */
export default async function ListingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const entitlement = await currentEntitlement();
  if (entitlement.level === "anonymous") redirect("/app/welcome");

  const unit = getLiveUnit(id);
  if (!unit) notFound();

  const { t } = await getI18n();
  const org = organizations.find((o) => o.id === unit.property.orgId);
  const property = viewFor(
    unit,
    entitlement,
    org ? { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified } : undefined,
  );

  const saved = entitlement.accountId ? await isSaved(entitlement.accountId, unit.id) : false;

  return (
    <div className="pb-32">
      <div className="relative">
        {property.access === "full" ? (
          <Thumb seed={property.id} className="h-[19rem] w-full rounded-none" />
        ) : (
          <LockedPhoto label={t("paywall.photosLocked")} className="h-[19rem]" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <Link
            href="/app"
            aria-label={t("common.back")}
            className="flex size-10 items-center justify-center rounded-full bg-background/85 text-foreground shadow-[var(--shadow-elev-1)] backdrop-blur"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <SaveButton
            unitId={property.id}
            initiallySaved={saved}
            canSave={property.access === "full"}
            savedLabel={t("listing.saved")}
            saveLabel={t("listing.save")}
            lockedLabel={t("paywall.savingLocked")}
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {property.access === "full"
                ? `${property.propertyName}, ${property.label}`
                : property.headline}
            </h1>
            <p className="mt-1 text-sm text-foreground-subtle">
              {property.access === "full"
                ? `${property.addressLine}, ${property.ward}`
                : `${property.ward}, ${property.district}`}
            </p>
          </div>
          {property.access === "full" && property.verified && (
            <Badge tone="brand">
              <ShieldCheck />
              {t("listing.verifiedBadge")}
            </Badge>
          )}
        </div>

        <p className="tnum mt-4 text-2xl font-semibold text-kaa-700 dark:text-kaa-400">
          {property.access === "full"
            ? money(property.rentAmount)
            : `${t("listing.rent")} ${money(property.rentFrom)}+`}
          <span className="text-sm font-normal text-foreground-subtle"> {t("common.perMonth")}</span>
        </p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-foreground-muted">
          <Fact icon={<BedDouble />} value={`${property.bedrooms}`} label={t("common.bedrooms")} />
          {property.access === "full" && (
            <>
              <Fact icon={<Bath />} value={`${property.bathrooms}`} label={t("common.bathrooms")} />
              {property.sizeSqm && <Fact icon={<Maximize />} value={`${property.sizeSqm} m²`} label="" />}
              <Fact icon={<Sofa />} value={property.furnishing.replace(/_/g, " ")} label="" />
            </>
          )}
        </div>
      </div>

      {property.access === "preview" ? (
        <section className="mx-5 mt-7 rounded-2xl border border-kaa-200 bg-kaa-50 p-5 dark:border-kaa-800 dark:bg-kaa-950/50">
          <p className="text-sm text-foreground-muted">{t("paywall.previewNote")}</p>

          <p className="mt-4 flex items-center gap-2 font-semibold">
            <Lock className="size-4" />
            {t("paywall.unlockToSee")}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground-muted">
            <li>• {t("paywall.itemPhotos")}</li>
            <li>• {t("paywall.itemDetails")}</li>
            <li>• {t("paywall.itemAmenities")}</li>
            <li>• {t("paywall.itemLandlord")}</li>
            <li>• {t("paywall.itemContact")}</li>
            <li>• {t("paywall.itemViewing")}</li>
            <li>• {t("paywall.itemLocation")}</li>
          </ul>

          <p className="tnum mt-5 text-lg font-semibold text-kaa-700 dark:text-kaa-400">
            {t("paywall.price")}
          </p>
          <ButtonLink href="/app/unlock" className="mt-4 w-full">
            {t("paywall.unlock")}
          </ButtonLink>
        </section>
      ) : (
        <>
          <section className="mt-7 px-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("listing.moveInCost")}
            </h2>
            <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface-raised">
              <Cost icon={<Banknote />} label={t("listing.rent")} value={money(property.rentAmount)} />
              <Cost
                icon={<Wallet />}
                label={t("listing.deposit")}
                value={money(property.rentAmount * property.depositMonths)}
              />
              <Cost
                icon={<Building2 />}
                label={t("listing.advance")}
                value={`${property.advanceMonths} × ${money(property.rentAmount)}`}
              />
              <div className="flex items-center justify-between px-4 py-3.5">
                <dt className="text-sm font-semibold">{t("listing.moveInCost")}</dt>
                <dd className="tnum text-base font-semibold text-kaa-700 dark:text-kaa-400">
                  {money(property.moveInCost)}
                </dd>
              </div>
            </dl>
          </section>

          {property.amenities.length > 0 && (
            <section className="mt-7 px-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                {t("listing.amenities")}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity.slug}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                  >
                    {amenity.en}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-7 px-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("listing.location")}
            </h2>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400">
                <Crosshair className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{property.addressLine}</p>
                {property.landmark && (
                  <p className="truncate text-xs text-foreground-subtle">{property.landmark}</p>
                )}
              </div>
            </a>
          </section>

          <section className="mt-7 px-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("listing.landlord")}
            </h2>
            <div className="mt-3 rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-sm font-medium">{property.managedBy.name}</p>
              {property.managedBy.phone && (
                <a
                  href={`tel:${property.managedBy.phone}`}
                  className="tnum mt-1 block text-sm text-kaa-700 dark:text-kaa-400"
                >
                  {property.managedBy.phone}
                </a>
              )}
            </div>
          </section>
        </>
      )}

      {property.access === "full" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-5 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] pt-3 backdrop-blur-xl">
          <ViewingButton unitId={property.id} label={t("listing.arrangeViewing")} />
        </div>
      )}
    </div>
  );
}

function Fact({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 [&_svg]:size-4">
      {icon}
      <span className="tnum font-medium capitalize text-foreground">{value}</span>
      {label && <span className="text-xs text-foreground-subtle">{label}</span>}
    </span>
  );
}

function Cost({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
        {icon}
      </span>
      <dt className="flex-1 text-sm text-foreground-muted">{label}</dt>
      <dd className="tnum text-sm font-medium">{value}</dd>
    </div>
  );
}
