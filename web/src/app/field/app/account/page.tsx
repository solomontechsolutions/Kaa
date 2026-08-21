import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/fieldops/officer-sign-out";
import { Badge } from "@/components/ui";
import { requireActor } from "@/lib/fieldops/session";
import { getOfficer } from "@/lib/fieldops/store";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Account" };

export default async function OfficerAccount() {
  const actor = await requireActor();
  const officer = getOfficer(actor.id)!;
  const { locale, t } = await getI18n();

  return (
    <div className="px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="flex items-center gap-3.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-kaa-50 text-lg font-semibold text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300">
          {officer.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">{officer.fullName}</h1>
          <p className="tnum text-sm text-foreground-subtle">{officer.employeeId}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface-raised p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("fieldops.officers.areas")}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {officer.assignedAreas.map((area) => (
            <Badge key={area} tone="neutral">{area}</Badge>
          ))}
        </div>
        {officer.deviceId && (
          <p className="tnum mt-4 text-xs text-foreground-subtle">
            {t("fieldops.officers.device")}: {officer.deviceId}
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-surface-raised p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("common.language")}
        </p>
        <div className="mt-4">
          <LanguageSwitcher current={locale} variant="list" />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold">{t("fieldops.settings.about")}</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {t("fieldops.settings.aboutBody")}
        </p>
      </section>

      <SignOutButton label={t("fieldops.signOut")} />
    </div>
  );
}
