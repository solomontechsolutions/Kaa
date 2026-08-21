"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { StatusPill } from "@/components/fieldops/status";
import { listDrafts, type LocalDraft } from "@/lib/fieldops/offline";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { PropertySubmission } from "@/lib/fieldops/types";
import { money } from "@/lib/format";

/**
 * Everything this officer has collected, on the device and on the server, in
 * one list. An officer does not think of those as two places — a property they
 * visited this morning is theirs whether or not it has reached Kaa yet.
 */
export function OfficerProperties({
  locale,
  submissions,
}: {
  locale: Locale;
  submissions: PropertySubmission[];
}) {
  const t = React.useMemo(() => translator(locale), [locale]);
  const [drafts, setDrafts] = React.useState<LocalDraft[]>([]);

  React.useEffect(() => {
    void listDrafts()
      .then((rows) => setDrafts(rows.filter((row) => !row.synced)))
      .catch(() => setDrafts([]));
  }, []);

  const rows = [
    ...drafts.map((draft) => ({
      key: draft.id,
      href: `/field/app/collect/${draft.id}`,
      reference: t("fieldops.app.savedOnDevice"),
      status: draft.status,
      ward: draft.property.ward,
      bedrooms: draft.property.bedrooms,
      rent: draft.property.monthlyRent,
    })),
    ...submissions.map((submission) => ({
      key: submission.id,
      href:
        submission.status === "CORRECTION_REQUIRED"
          ? `/field/app/collect/${submission.id}`
          : `/field/app/properties`,
      reference: submission.reference,
      status: submission.status,
      ward: submission.property.ward,
      bedrooms: submission.property.bedrooms,
      rent: submission.property.monthlyRent,
    })),
  ];

  return (
    <div className="px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <h1 className="text-xl font-semibold tracking-tight">{t("fieldops.app.myProperties")}</h1>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-surface text-foreground-subtle">
            <ClipboardList className="size-6" />
          </span>
          <p className="mt-4 font-medium">{t("fieldops.table.empty")}</p>
          <Link href="/field/app/collect/new" className="mt-4 text-sm font-medium text-kaa-700 dark:text-kaa-400">
            {t("fieldops.app.startCollecting")}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <Link href={row.href} className="block rounded-2xl border border-border bg-surface-raised p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="tnum truncate text-sm font-medium">{row.reference}</span>
                  <StatusPill status={row.status} locale={locale} compact />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-foreground-subtle">
                  <span className="truncate">
                    {row.ward ?? "—"} · {row.bedrooms ?? "—"} bed
                  </span>
                  <span className="tnum shrink-0">{row.rent ? money(row.rent) : "—"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
