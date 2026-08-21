"use client";

import { AlertTriangle, CloudOff, CloudUpload, Loader2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { StatusPill } from "@/components/fieldops/status";
import { Button } from "@/components/ui";
import { flushQueue, isOnline, listDrafts, type LocalDraft } from "@/lib/fieldops/offline";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { PropertySubmission } from "@/lib/fieldops/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Assignment {
  ward: string;
  target: number;
  collected: number;
  dueOn: string;
}

/**
 * The officer's day.
 *
 * Ordered by what needs doing, not by what is tidy: anything Kaa has sent back
 * comes first, because it is a trip already made that has not yet been paid
 * for. Then what is waiting to upload, then today's assignments.
 */
export function OfficerHome({
  locale,
  officerName,
  submissions,
  assignments,
}: {
  locale: Locale;
  officerName: string;
  submissions: PropertySubmission[];
  assignments: Assignment[];
}) {
  const t = React.useMemo(() => translator(locale), [locale]);
  const router = useRouter();

  const [drafts, setDrafts] = React.useState<LocalDraft[]>([]);
  const [flushing, setFlushing] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  /**
   * Whether the handset has a signal.
   *
   * Subscribed rather than mirrored into state: `navigator.onLine` is an
   * external value the browser owns, and copying it into React state means two
   * sources of truth that can disagree. The server snapshot is `true` because
   * the offline warning is the surprising thing to render, and rendering it
   * during SSR would flash it at every officer on every load.
   */
  const online = React.useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => isOnline(),
    () => true,
  );

  /** Bumped after an upload, to re-read what is left on the device. */
  const [reloadToken, setReloadToken] = React.useState(0);
  const refresh = React.useCallback(() => setReloadToken((value) => value + 1), []);

  // Reading the device's drafts is a subscription to something outside React,
  // so it belongs in an effect — with a cancel flag, because an officer can
  // leave this screen while IndexedDB is still answering.
  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      const rows = await listDrafts().catch(() => []);
      if (!cancelled) setDrafts(rows);
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // When the signal comes back, send whatever has been waiting. This is the
  // behaviour that makes offline collection worth having at all.
  React.useEffect(() => {
    if (!online) return;
    let cancelled = false;

    void (async () => {
      const { sent } = await flushQueue();
      if (cancelled) return;
      if (sent > 0) {
        setNotice(t("fieldops.app.uploadedOk"));
        router.refresh();
      }
      refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [online, refresh, router, t]);

  const corrections = submissions.filter((row) => row.status === "CORRECTION_REQUIRED");
  const waiting = submissions.filter((row) => ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(row.status));
  const approved = submissions.filter((row) => row.status === "APPROVED").length;
  const queued = drafts.filter((draft) => !draft.synced);

  async function sendQueue() {
    setFlushing(true);
    try {
      const { sent, failed } = await flushQueue();
      setNotice(
        failed > 0 ? t("fieldops.app.uploadFailed") : sent > 0 ? t("fieldops.app.uploadedOk") : null,
      );
      refresh();
      router.refresh();
    } finally {
      setFlushing(false);
    }
  }

  return (
    <div className="pb-8">
      <header className="px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <p className="text-xs text-foreground-subtle">{t("fieldops.app.today")}</p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{officerName}</h1>
      </header>

      {!online && (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-2xl border border-[#F5E0B8] bg-[#FDF3E0] p-4 dark:border-[#4A3510] dark:bg-[#33240A]">
          <CloudOff className="mt-0.5 size-4 shrink-0 text-[#8A5A00] dark:text-[#FBBF24]" />
          <p className="text-sm leading-relaxed text-[#8A5A00] dark:text-[#FBBF24]">
            {t("fieldops.app.offlineNotice")}
          </p>
        </div>
      )}

      {notice && (
        <p role="status" className="mx-5 mb-4 rounded-xl bg-kaa-50 px-3.5 py-2.5 text-sm text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300">
          {notice}
        </p>
      )}

      <section className="mx-5 grid grid-cols-4 gap-2">
        <Tile label={t("fieldops.app.collected")} value={submissions.length + drafts.length} />
        <Tile label={t("fieldops.app.pendingUploadShort")} value={queued.length} tone={queued.length ? "info" : "neutral"} />
        <Tile label={t("fieldops.app.correctionsShort")} value={corrections.length} tone={corrections.length ? "danger" : "neutral"} />
        <Tile label={t("fieldops.app.approvedShort")} value={approved} tone="brand" />
      </section>

      <div className="mx-5 mt-4">
        <Link
          href="/field/app/collect/new"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-kaa-500 text-base font-medium text-ink-950 active:scale-[0.99]"
        >
          <Plus className="size-5" />
          {t("fieldops.app.startCollecting")}
        </Link>
      </div>

      {corrections.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-[var(--color-danger)]">
            <AlertTriangle className="size-3.5" />
            {t("fieldops.app.actionRequired")}
          </h2>
          <ul className="space-y-3">
            {corrections.map((submission) => {
              const open = submission.corrections.find((correction) => !correction.resolvedAt);
              return (
                <li key={submission.id}>
                  <Link
                    href={`/field/app/collect/${submission.id}`}
                    className="block rounded-2xl border border-[#F7CDD2] bg-[#FDECEE] p-4 dark:border-[#5A2027] dark:bg-[#37151A]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="tnum text-sm font-semibold">{submission.reference}</span>
                      <StatusPill status={submission.status} locale={locale} compact />
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {submission.property.ward} · {submission.property.bedrooms} bed
                    </p>
                    {open && (
                      <>
                        <p className="mt-2.5 text-xs font-medium uppercase tracking-wider text-[#A61B2B] dark:text-[#FB7185]">
                          {t("fieldops.app.kaaOperatorSays")}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">{open.message}</p>
                      </>
                    )}
                    <p className="mt-3 text-sm font-medium text-kaa-700 dark:text-kaa-400">
                      {t("fieldops.app.editSubmission")} →
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {queued.length > 0 && (
        <section className="mt-7 px-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("fieldops.app.queued")}
            </h2>
            <Button size="sm" variant="outline" onClick={sendQueue} disabled={flushing || !online}>
              {flushing ? <Loader2 className="animate-spin" /> : <CloudUpload />}
              {flushing ? t("fieldops.app.uploadingNow") : t("fieldops.app.uploadProperty")}
            </Button>
          </div>
          <ul className="space-y-2.5">
            {queued.map((draft) => (
              <li key={draft.id}>
                <Link
                  href={`/field/app/collect/${draft.id}`}
                  className="block rounded-2xl border border-border bg-surface-raised p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {draft.property.ward ?? "—"} · {draft.property.bedrooms ?? "—"} bed
                    </span>
                    <StatusPill status={draft.status} locale={locale} compact />
                  </div>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {t("fieldops.app.savedOnDevice")}
                    {draft.property.monthlyRent ? ` · ${money(draft.property.monthlyRent)}` : ""}
                  </p>
                  {draft.lastError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
                      <RefreshCw className="size-3" />
                      {draft.lastError}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {assignments.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            {t("fieldops.app.todaysAssignments")}
          </h2>
          <ul className="space-y-2.5">
            {assignments.map((assignment) => {
              const progress = assignment.target ? (assignment.collected / assignment.target) * 100 : 0;
              return (
                <li key={assignment.ward} className="rounded-2xl border border-border bg-surface-raised p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{assignment.ward}</p>
                    <span className="tnum text-sm text-foreground-muted">
                      {assignment.collected}/{assignment.target}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className={cn("h-full rounded-full", progress >= 100 ? "bg-kaa-500" : "bg-kaa-400/70")}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            {t("fieldops.status.UNDER_REVIEW")}
          </h2>
          <ul className="space-y-2.5">
            {waiting.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised p-4"
              >
                <div className="min-w-0">
                  <p className="tnum text-sm font-medium">{submission.reference}</p>
                  <p className="truncate text-xs text-foreground-subtle">
                    {submission.property.ward} · {submission.property.bedrooms} bed
                  </p>
                </div>
                <StatusPill status={submission.status} locale={locale} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "brand" | "info" | "danger";
}) {
  const accent = {
    neutral: "text-foreground",
    brand: "text-kaa-700 dark:text-kaa-400",
    info: "text-[#1A4FA8] dark:text-[#93B8FF]",
    danger: "text-[var(--color-danger)]",
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-3 text-center">
      <p className={cn("tnum text-xl font-semibold", accent)}>{value}</p>
      <p className="mt-0.5 text-[0.65rem] leading-tight text-foreground-subtle">{label}</p>
    </div>
  );
}
