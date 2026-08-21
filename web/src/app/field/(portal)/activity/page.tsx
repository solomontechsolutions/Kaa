import { dateTime } from "@/lib/format";
import { requireActor } from "@/lib/fieldops/session";
import { findSubmissions } from "@/lib/fieldops/service";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";

export const metadata = { title: "Activity" };

/**
 * The audit trail, flattened across every submission the caller may see.
 *
 * Not a log for engineers — an operational record. "Who said the rent was
 * wrong, and when did the officer answer" is a question this page has to be
 * able to settle.
 */
export default async function ActivityPage() {
  const actor = await requireActor();
  const { t } = await getI18n();

  const events = findSubmissions(actor)
    .flatMap((submission) => submission.history.map((event) => ({ event, submission })))
    .sort((a, b) => b.event.at.localeCompare(a.event.at))
    .slice(0, 120);

  // Group by day, because "what happened yesterday" is how people ask.
  const byDay = new Map<string, typeof events>();
  for (const row of events) {
    const day = row.event.at.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), row]);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.activity.title")}</h1>
        <p className="mt-1.5 text-foreground-muted">{t("fieldops.activity.subtitle")}</p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-raised px-6 py-16 text-center">
          <p className="font-medium">{t("fieldops.activity.empty")}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-foreground-muted">
            {t("fieldops.activity.emptyBody")}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...byDay.entries()].map(([day, rows]) => (
            <section key={day}>
              <h2 className="tnum mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                {day}
              </h2>
              <ol className="space-y-1 border-l border-border pl-4">
                {rows.map(({ event, submission }) => (
                  <li key={event.id} className="relative py-2.5">
                    <span className="absolute -left-[1.3rem] top-4 size-1.5 rounded-full bg-border-strong" />
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="tnum text-xs text-foreground-subtle">
                        {dateTime(event.at).split(", ")[1] ?? dateTime(event.at)}
                      </span>
                      <p className="min-w-0 flex-1 text-sm leading-relaxed">{event.detail}</p>
                      <Link
                        href={`/field/submissions/${submission.id}`}
                        className="tnum shrink-0 text-xs font-medium text-kaa-700 hover:underline dark:text-kaa-400"
                      >
                        {submission.reference}
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
