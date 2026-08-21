import { ArrowRight, CheckCircle2, CircleDashed, CloudUpload, RotateCcw, Users } from "lucide-react";
import Link from "next/link";

import { SubmissionsTable } from "@/components/fieldops/data-table";
import { RelativeTime } from "@/components/fieldops/relative-time";
import { StatusPill } from "@/components/fieldops/status";
import { requireActor } from "@/lib/fieldops/session";
import { findSubmissions, operationsSummary } from "@/lib/fieldops/service";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

/**
 * What a supervisor needs in the first five seconds: how much came in, how
 * much is stuck, and what has been waiting on Kaa longest. The last one is the
 * number that actually costs FieldOps money — an officer's approved listing is
 * paid, and one sitting in a queue is not.
 */
export default async function FieldOpsDashboard() {
  const actor = await requireActor();
  const { locale, t } = await getI18n();

  const summary = operationsSummary(actor);
  const all = findSubmissions(actor);
  const recent = all.slice(0, 8);

  const waiting = all
    .filter((row) => ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(row.status))
    .sort((a, b) => (a.uploadedAt ?? a.createdAt).localeCompare(b.uploadedAt ?? b.createdAt))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[86rem] space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.dashboard.title")}</h1>
        <p className="mt-1.5 text-foreground-muted">{t("fieldops.dashboard.subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label={t("fieldops.dashboard.collectedToday")}
          value={summary.collectedToday}
          icon={<CloudUpload />}
        />
        <Metric
          label={t("fieldops.dashboard.underReview")}
          value={summary.underReview}
          icon={<CircleDashed />}
          tone="warning"
          href="/field/submissions?status=UPLOADED&status=UNDER_REVIEW&status=RESUBMITTED"
        />
        <Metric
          label={t("fieldops.dashboard.correctionsRequired")}
          value={summary.correctionsRequired}
          icon={<RotateCcw />}
          tone={summary.correctionsRequired > 0 ? "danger" : "neutral"}
          href="/field/submissions?status=CORRECTION_REQUIRED"
        />
        <Metric
          label={t("fieldops.dashboard.approved")}
          value={summary.approved}
          icon={<CheckCircle2 />}
          tone="brand"
          href="/field/submissions?status=APPROVED"
        />
        <Metric
          label={t("fieldops.dashboard.approvalRate")}
          value={`${summary.approvalRate.toFixed(0)}%`}
          sub={t("fieldops.dashboard.activeOfficers") + `: ${summary.activeOfficers}`}
          icon={<Users />}
          href="/field/officers"
        />
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("fieldops.dashboard.recentSubmissions")}
            </h2>
            <Link
              href="/field/submissions"
              className="inline-flex items-center gap-1 text-sm font-medium text-kaa-700 hover:underline dark:text-kaa-400"
            >
              {t("fieldops.dashboard.viewAll")} <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <SubmissionsTable
            submissions={recent}
            locale={locale}
            compact
            labels={{
              reference: t("fieldops.table.reference"),
              officer: t("fieldops.table.officer"),
              location: t("fieldops.table.location"),
              property: t("fieldops.table.property"),
              rent: t("fieldops.table.rent"),
              status: t("fieldops.table.status"),
              updated: t("fieldops.table.updated"),
            }}
            emptyTitle={t("fieldops.table.empty")}
            emptyBody={t("fieldops.table.emptyBody")}
          />
        </div>

        <div className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            {t("fieldops.dashboard.needsAttention")}
          </h2>

          {waiting.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-raised px-5 py-10 text-center">
              <p className="text-sm text-foreground-muted">{t("fieldops.dashboard.nothingWaiting")}</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {waiting.map((submission) => (
                <li key={submission.id}>
                  <Link
                    href={`/field/submissions/${submission.id}`}
                    className="block rounded-2xl border border-border bg-surface-raised p-4 transition-colors hover:border-kaa-300 dark:hover:border-kaa-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="tnum text-sm font-medium">{submission.reference}</span>
                      <StatusPill status={submission.status} locale={locale} compact />
                    </div>
                    <p className="mt-1.5 truncate text-sm text-foreground-muted">
                      {submission.property.ward} · {submission.officerName}
                    </p>
                    <p className="mt-1 text-xs text-foreground-subtle">
                      <RelativeTime iso={submission.uploadedAt ?? submission.createdAt} />
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  tone?: "neutral" | "brand" | "warning" | "danger";
  href?: string;
}) {
  const accent = {
    neutral: "text-foreground",
    brand: "text-kaa-700 dark:text-kaa-400",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
          {icon}
        </span>
      </div>
      <p className={cn("tnum mt-3 text-3xl font-semibold tracking-tight", accent)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-foreground-subtle">{sub}</p>}
    </>
  );

  const className =
    "block rounded-2xl border border-border bg-surface-raised p-5 transition-colors";

  return href ? (
    <Link href={href} className={cn(className, "hover:border-kaa-300 dark:hover:border-kaa-800")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
