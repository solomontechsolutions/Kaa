"use client";

import { AlertTriangle, Check, Loader2, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Kaa's decision on a FieldOps submission.
 *
 * Approve and Reject both confirm first, because both are one-way: an approved
 * property is published to tenants and can no longer be edited, and a
 * rejection closes the record. Send-back is not confirmed — it is the
 * reversible one, and its own dialog already forces the operator to write
 * something.
 *
 * Every button calls the API and the server decides. A field officer who
 * reaches this component by any means still gets 403 from the route.
 */

type Dialog = null | "approve" | "send_back" | "reject";

const FLAGGABLE = [
  "monthlyRent",
  "bedrooms",
  "bathrooms",
  "propertyKind",
  "ward",
  "addressLine",
  "latitude",
  "amenities",
  "landlordPhone",
  "photos.exterior",
] as const;

export function ReviewActions({
  submissionId,
  locale,
  canReview,
}: {
  submissionId: string;
  locale: Locale;
  canReview: boolean;
}) {
  const router = useRouter();
  const t = React.useMemo(() => translator(locale), [locale]);

  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [message, setMessage] = React.useState("");
  const [fields, setFields] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!canReview) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground-muted">
        {t("fieldops.review.onlyKaaOperators")}
      </p>
    );
  }

  async function act(action: "approve" | "send_back" | "reject") {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/fieldops/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "send_back"
            ? { action, message, fields }
            : action === "reject"
              ? { action, reason: message }
              : { action },
        ),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.message ?? t("common.somethingWentWrong"));
        return;
      }

      setDialog(null);
      setMessage("");
      setFields([]);
      router.refresh();
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => setDialog("approve")} disabled={busy}>
          <Check />
          {t("fieldops.review.approve")}
        </Button>
        <Button variant="outline" onClick={() => setDialog("send_back")} disabled={busy}>
          <RotateCcw />
          {t("fieldops.review.sendBack")}
        </Button>
        <Button variant="ghost" onClick={() => setDialog("reject")} disabled={busy}>
          <X />
          {t("fieldops.review.reject")}
        </Button>
      </div>

      {dialog === "approve" && (
        <Modal
          title={t("fieldops.review.approveConfirm")}
          body={t("fieldops.review.approveConfirmBody")}
          onClose={() => setDialog(null)}
        >
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-6 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => act("approve")} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              {t("fieldops.review.approve")}
            </Button>
          </div>
        </Modal>
      )}

      {dialog === "send_back" && (
        <Modal
          title={t("fieldops.review.sendBackTitle")}
          body={t("fieldops.review.sendBackBody")}
          onClose={() => setDialog(null)}
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder={t("fieldops.review.sendBackPlaceholder")}
            className="mt-5 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none transition-colors focus:border-kaa-400"
          />

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("fieldops.review.flagFields")}
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FLAGGABLE.map((field) => {
                const on = fields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() =>
                      setFields((current) =>
                        current.includes(field)
                          ? current.filter((value) => value !== field)
                          : [...current, field],
                      )
                    }
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on
                        ? "border-kaa-400 bg-kaa-50 text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300"
                        : "border-border bg-surface text-foreground-muted",
                    )}
                  >
                    {t(`fieldops.field.${field.replace("photos.exterior", "photos")}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {message.trim().length > 0 && message.trim().length < 10 && (
            <p className="mt-3 text-xs text-[var(--color-danger)]">
              {t("fieldops.review.sendBackTooShort")}
            </p>
          )}
          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="mt-6 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => act("send_back")} disabled={busy || message.trim().length < 10}>
              {busy ? <Loader2 className="animate-spin" /> : <RotateCcw />}
              {t("fieldops.review.sendBackSubmit")}
            </Button>
          </div>
        </Modal>
      )}

      {dialog === "reject" && (
        <Modal
          title={t("fieldops.review.rejectTitle")}
          body={t("fieldops.review.rejectBody")}
          tone="danger"
          onClose={() => setDialog(null)}
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="mt-5 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-sm outline-none transition-colors focus:border-kaa-400"
          />
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-6 flex justify-end gap-2.5">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => act("reject")} disabled={busy || message.trim().length < 10}>
              {busy ? <Loader2 className="animate-spin" /> : <X />}
              {t("fieldops.review.rejectSubmit")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  body,
  tone = "neutral",
  onClose,
  children,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "danger";
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface-raised p-6 shadow-[var(--shadow-elev-3)]">
        <div className="flex items-start gap-3">
          {tone === "danger" && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FDECEE] text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
              <AlertTriangle className="size-4.5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{body}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
      {children}
    </p>
  );
}
