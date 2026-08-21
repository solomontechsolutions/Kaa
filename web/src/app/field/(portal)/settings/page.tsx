import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Badge } from "@/components/ui";
import { requireActor } from "@/lib/fieldops/session";
import { getOfficer } from "@/lib/fieldops/store";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Settings" };

export default async function FieldOpsSettings() {
  const actor = await requireActor();
  const officer = getOfficer(actor.id)!;
  const { locale, t } = await getI18n();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.settings.title")}</h1>
        <p className="mt-1.5 text-foreground-muted">{t("fieldops.settings.subtitle")}</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("fieldops.settings.account")}
        </h2>
        <dl className="mt-4 space-y-3">
          <Row label={t("fieldops.officers.name")} value={officer.fullName} />
          <Row label={t("fieldops.employeeId")} value={officer.employeeId} />
          <Row label={t("fieldops.officers.name")} value={t(`fieldops.role.${officer.role}`)} />
          {officer.assignedAreas.length > 0 && (
            <Row label={t("fieldops.officers.areas")} value={officer.assignedAreas.join(", ")} />
          )}
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("fieldops.settings.language")}
        </h2>
        <div className="mt-4">
          <LanguageSwitcher current={locale} variant="list" />
        </div>
      </section>

      {officer.deviceId && (
        <section className="rounded-2xl border border-border bg-surface-raised p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            {t("fieldops.settings.deviceSection")}
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <Badge tone="outline" className="tnum">{officer.deviceId}</Badge>
            <span className="text-sm text-foreground-muted">{t("fieldops.officers.device")}</span>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">{t("fieldops.settings.about")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {t("fieldops.settings.aboutBody")}
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
