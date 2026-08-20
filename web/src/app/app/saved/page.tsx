import { Bookmark, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PropertyCard } from "@/components/app/property-card";
import { ButtonLink } from "@/components/ui";
import { currentEntitlement } from "@/lib/access/session";
import { toMemberView } from "@/lib/access/redact";
import { listSaved } from "@/lib/accounts/store";
import { getLiveUnit } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { getTranslate } from "@/lib/i18n/server";

export const metadata = { title: "Saved" };

const orgIndex = new Map(
  organizations.map((org) => [org.id, { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified }]),
);

/**
 * Saved homes.
 *
 * Membership is checked here and again in `/api/saved`. There is no local
 * storage fallback — a free user's saves do not exist anywhere, on any device,
 * which is the difference between a paywall and a hidden button.
 */
export default async function AppSavedPage() {
  const entitlement = await currentEntitlement();
  if (entitlement.level === "anonymous") redirect("/app/welcome");

  const t = await getTranslate();

  if (entitlement.level !== "member") {
    return (
      <div className="flex min-h-full flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <h1 className="text-xl font-semibold tracking-tight">{t("saved.title")}</h1>
        <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400">
            <Lock className="size-6" />
          </span>
          <p className="mt-4 font-medium">{t("paywall.savingLocked")}</p>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-foreground-muted">
            {t("paywall.savingLockedBody")}
          </p>
          <ButtonLink href="/app/unlock" className="mt-6">
            {t("paywall.unlock")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const rows = await listSaved(entitlement.accountId!);
  const properties = rows
    .map((row) => getLiveUnit(row.unitId))
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))
    .map((unit) => toMemberView(unit, orgIndex.get(unit.property.orgId)));

  if (!properties.length) {
    return (
      <div className="flex min-h-full flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <h1 className="text-xl font-semibold tracking-tight">{t("saved.title")}</h1>
        <div className="flex flex-1 flex-col items-center justify-center pb-24 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface text-foreground-subtle">
            <Bookmark className="size-6" />
          </span>
          <p className="mt-4 font-medium">{t("saved.empty")}</p>
          <p className="mt-1.5 max-w-xs text-sm text-foreground-muted">{t("saved.emptyBody")}</p>
          <ButtonLink href="/app/search" className="mt-6">
            {t("saved.browse")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <h1 className="text-xl font-semibold tracking-tight">{t("saved.title")}</h1>
      <ul className="mt-5 space-y-3">
        {properties.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} photosLockedLabel={t("paywall.photosLocked")} />
          </li>
        ))}
      </ul>
      <Link href="/app/search" className="mt-6 block text-center text-sm font-medium text-kaa-700 dark:text-kaa-400">
        {t("saved.browse")}
      </Link>
    </div>
  );
}
