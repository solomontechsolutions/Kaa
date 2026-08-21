import { requireActor } from "@/lib/fieldops/session";
import { findSubmissions } from "@/lib/fieldops/service";
import { listOfficers } from "@/lib/fieldops/store";
import { getI18n } from "@/lib/i18n/server";
import { StatusPill } from "@/components/fieldops/status";
import type { SubmissionStatus } from "@/lib/fieldops/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reports" };

/**
 * How the operation is doing.
 *
 * Bars rather than a charting library: three distributions over a handful of
 * categories each, which a div with a width renders more legibly than a canvas
 * and without shipping a dependency to do it.
 */
export default async function ReportsPage() {
  const actor = await requireActor();
  const { locale, t } = await getI18n();
  const rows = findSubmissions(actor);

  const byWard = tally(rows.map((row) => row.property.ward ?? "—"));

  const statuses: SubmissionStatus[] = [
    "DRAFT", "READY_FOR_UPLOAD", "UPLOADED", "UNDER_REVIEW",
    "CORRECTION_REQUIRED", "RESUBMITTED", "APPROVED", "REJECTED",
  ];
  const byStatus = statuses
    .map((status) => ({ key: status, count: rows.filter((row) => row.status === status).length }))
    .filter((entry) => entry.count > 0);

  const officers = listOfficers()
    .filter((officer) => officer.role === "field_officer")
    .map((officer) => {
      const mine = rows.filter((row) => row.officerId === officer.id);
      const approved = mine.filter((row) => row.status === "APPROVED").length;
      const decided = approved + mine.filter((row) => row.status === "REJECTED").length;
      return {
        name: officer.fullName,
        collected: mine.length,
        rate: decided ? (approved / decided) * 100 : null,
      };
    })
    .filter((officer) => officer.collected > 0)
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  // Only the corrections that were actually raised — nothing inferred.
  const corrections = rows.flatMap((row) => row.corrections);

  return (
    <div className="mx-auto max-w-[76rem] space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.reports.title")}</h1>
        <p className="mt-1.5 text-foreground-muted">{t("fieldops.reports.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("fieldops.reports.byWard")}>
          {byWard.length === 0 ? (
            <Empty text={t("fieldops.reports.noData")} />
          ) : (
            <ul className="space-y-3">
              {byWard.map(([ward, count]) => (
                <li key={ward}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{ward}</span>
                    <span className="tnum shrink-0 font-medium">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-kaa-500"
                      style={{ width: `${(count / byWard[0]![1]) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("fieldops.reports.throughput")}>
          {byStatus.length === 0 ? (
            <Empty text={t("fieldops.reports.noData")} />
          ) : (
            <ul className="space-y-3">
              {byStatus.map((entry) => (
                <li key={entry.key} className="flex items-center gap-3">
                  <StatusPill status={entry.key} locale={locale} compact className="shrink-0" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-kaa-400"
                      style={{ width: `${(entry.count / Math.max(...byStatus.map((s) => s.count))) * 100}%` }}
                    />
                  </div>
                  <span className="tnum w-8 shrink-0 text-right text-sm font-medium">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("fieldops.reports.byOfficer")}>
          {officers.length === 0 ? (
            <Empty text={t("fieldops.reports.noData")} />
          ) : (
            <ul className="space-y-3">
              {officers.map((officer) => (
                <li key={officer.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{officer.name}</span>
                    <span className="tnum shrink-0 font-medium">
                      {officer.rate === null ? "—" : `${officer.rate.toFixed(0)}%`}
                      <span className="ml-1.5 text-xs font-normal text-foreground-subtle">
                        ({officer.collected})
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        (officer.rate ?? 0) >= 80 ? "bg-kaa-500" : "bg-[var(--color-warning)]",
                      )}
                      style={{ width: `${officer.rate ?? 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("fieldops.reports.correctionReasons")}>
          {corrections.length === 0 ? (
            <Empty text={t("fieldops.reports.noData")} />
          ) : (
            <ul className="space-y-3">
              {corrections.slice(0, 6).map((correction) => (
                <li key={correction.id} className="rounded-xl border border-border bg-surface p-3">
                  <p className="line-clamp-2 text-sm leading-relaxed">{correction.message}</p>
                  <p className="mt-1.5 text-xs text-foreground-subtle">
                    {correction.raisedByName}
                    {correction.resolvedAt ? " · answered" : " · open"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function tally(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-foreground-subtle">{text}</p>;
}
