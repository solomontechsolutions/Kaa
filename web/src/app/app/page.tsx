import { ArrowRight, Lock, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KaaMark } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PropertyCard } from "@/components/app/property-card";
import { currentEntitlement } from "@/lib/access/session";
import { viewsFor } from "@/lib/access/redact";
import { activeWards, listLiveUnits } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { getI18n } from "@/lib/i18n/server";

const orgIndex = new Map(
  organizations.map((org) => [org.id, { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified }]),
);

/**
 * The app's front door.
 *
 * Someone with no Kaa account is sent to `/app/welcome` to create one — the
 * app opens on an account, not on a feed. Everyone past that sees the same
 * homes; what differs is the shape, which `viewsFor` decides on the server.
 */
export default async function AppHomePage() {
  const entitlement = await currentEntitlement();
  if (entitlement.level === "anonymous") redirect("/app/welcome");

  const { locale, t } = await getI18n();

  const live = listLiveUnits();
  const views = viewsFor(live, entitlement, orgIndex);
  const [featured, ...rest] = views;
  const wards = activeWards();

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-background/85 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <KaaMark className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs text-foreground-subtle">{t("splash.greeting")}</p>
              <p className="truncate text-sm font-semibold leading-tight">{t("welcome.title")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher current={locale} />
            <Link
              href="/app/search"
              aria-label={t("search.filters")}
              className="flex size-9 items-center justify-center rounded-full bg-surface text-foreground-muted"
            >
              <SlidersHorizontal className="size-4" />
            </Link>
          </div>
        </div>

        <Link
          href="/app/search"
          className="mt-4 flex h-12 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm text-foreground-subtle"
        >
          <Search className="size-4 shrink-0" />
          {t("search.placeholder")}
        </Link>
      </header>

      <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto px-5 pb-4">
        {wards.map((ward) => (
          <Link
            key={ward}
            href={`/app/search?q=${encodeURIComponent(ward)}`}
            className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium"
          >
            {ward}
          </Link>
        ))}
      </div>

      {entitlement.level !== "member" && (
        <section className="mx-5 mb-5 rounded-2xl border border-kaa-200 bg-kaa-50 p-5 dark:border-kaa-800 dark:bg-kaa-950/50">
          <span className="flex size-10 items-center justify-center rounded-xl bg-kaa-500/15 text-kaa-700 dark:text-kaa-400">
            <Lock className="size-4.5" />
          </span>
          <p className="mt-3.5 font-semibold tracking-tight">
            {t("paywall.lockedTitle", { count: live.length })}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{t("paywall.lockedBody")}</p>
          <p className="tnum mt-3 text-lg font-semibold text-kaa-700 dark:text-kaa-400">{t("paywall.price")}</p>
          <Link
            href="/app/unlock"
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-kaa-500 text-sm font-medium text-ink-950 active:scale-[0.98]"
          >
            {t("paywall.unlock")}
            <ArrowRight className="size-4" />
          </Link>
        </section>
      )}

      {featured && (
        <section className="px-5">
          <PropertyCard property={featured} photosLockedLabel={t("paywall.photosLocked")} />
        </section>
      )}

      <section className="mt-7 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            {t("search.availableNow")}
          </h2>
          <Link
            href="/app/search"
            className="inline-flex items-center gap-1 text-xs font-medium text-kaa-700 dark:text-kaa-400"
          >
            {t("search.seeAll")} <ArrowRight className="size-3" />
          </Link>
        </div>

        <ul className="space-y-3">
          {rest.map((property) => (
            <li key={property.id}>
              <PropertyCard property={property} photosLockedLabel={t("paywall.photosLocked")} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
