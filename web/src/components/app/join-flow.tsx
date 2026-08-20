"use client";

import { ArrowLeft, ArrowRight, Check, Fingerprint, Loader2, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge, Button, Card } from "@/components/ui";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type Step = "nida" | "phone" | "code" | "done";

interface Identity {
  fullName?: string;
  dateOfBirth?: string;
  sex?: string;
  nationality?: string;
}

/**
 * Creating a Kaa account: NIDA, then the phone, then done.
 *
 * The two are deliberately separate steps. NIDA says who someone is; it does
 * not say they are holding this handset, and the approved NIDA response may
 * carry no usable number at all. Neither step has anything to do with paying
 * for Kaa — the last screen says so in as many words, because a tenant who
 * thinks verification cost them money will not come back.
 *
 * Nothing here decides access. Every call goes to a route that checks
 * server-side; this component only moves between screens.
 */
export function JoinFlow({ locale }: { locale: Locale }) {
  const router = useRouter();
  // The dictionaries are plain data, so the translator is built here rather
  // than handed across the server/client boundary, where a function cannot go.
  const t = React.useMemo(() => translator(locale), [locale]);

  const [step, setStep] = React.useState<Step>("nida");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [nida, setNida] = React.useState("");
  const [identity, setIdentity] = React.useState<Identity | null>(null);
  const [developmentIdentity, setDevelopmentIdentity] = React.useState(false);

  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeDelivered, setCodeDelivered] = React.useState(true);

  const nidaDigits = nida.replace(/\D/g, "");

  async function submitNida(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account/nida", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nida: nidaDigits, language: locale }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(
          payload.error === "not_found"
            ? t("join.nidaFailed")
            : payload.error === "unavailable"
              ? t("join.nidaUnavailable")
              : payload.error === "invalid_nida"
                ? t("join.nidaFailed")
                : t("common.somethingWentWrong"),
        );
        return;
      }

      setIdentity(payload.identity ?? null);
      setDevelopmentIdentity(payload.source === "development");
      if (payload.suggestedPhone) setPhone(payload.suggestedPhone);
      setStep(payload.phoneVerified ? "done" : "phone");
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(
          payload.error === "phone_taken"
            ? "That number is already on another Kaa account."
            : payload.error === "rate_limited"
              ? "Too many codes requested. Try again in a while."
              : payload.message ?? t("common.somethingWentWrong"),
        );
        return;
      }

      setPhone(payload.phone);
      setCodeDelivered(payload.delivered);
      setStep("code");
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      if (!response.ok) {
        setError(t("join.phoneFailed"));
        return;
      }
      setStep("done");
      router.refresh();
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header className="flex items-center gap-3">
        {step !== "done" && (
          <button
            type="button"
            onClick={() => (step === "nida" ? router.push("/app/welcome") : setStep(step === "code" ? "phone" : "nida"))}
            aria-label={t("common.back")}
            className="flex size-10 items-center justify-center rounded-full bg-surface text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4.5" />
          </button>
        )}
        <p className="text-sm font-medium text-foreground-muted">{t("join.title")}</p>
      </header>

      <Progress step={step} />

      <div className="flex-1 pt-8">
        {step === "nida" && (
          <form onSubmit={submitNida} className="space-y-5">
            <StepHeading icon={<Fingerprint />} title={t("join.nidaStep")} body={t("join.nidaHelp")} />

            <div>
              <label htmlFor="nida" className="mb-2 block text-sm font-medium">
                {t("join.nidaLabel")}
              </label>
              <input
                id="nida"
                inputMode="numeric"
                autoComplete="off"
                value={nida}
                onChange={(event) => setNida(event.target.value)}
                placeholder={t("join.nidaPlaceholder")}
                className="tnum h-13 w-full rounded-2xl border border-border bg-surface px-4 text-base tracking-wide outline-none transition-colors focus:border-kaa-400 focus:ring-2 focus:ring-kaa-500/25"
              />
              <p className="tnum mt-2 text-xs text-foreground-subtle">{nidaDigits.length} / 20</p>
            </div>

            <p className="text-xs leading-relaxed text-foreground-subtle">{t("join.privacyNote")}</p>

            {error && <ErrorNote>{error}</ErrorNote>}

            <Button type="submit" size="lg" className="w-full" disabled={busy || nidaDigits.length !== 20}>
              {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {busy ? t("join.verifying") : t("join.verify")}
            </Button>
          </form>
        )}

        {step === "phone" && (
          <form onSubmit={requestCode} className="space-y-5">
            {identity && (
              <Card className="p-5">
                <Badge tone="success">
                  <ShieldCheck />
                  {t("join.nidaVerified")}
                </Badge>
                <p className="mt-3 text-lg font-semibold tracking-tight">{identity.fullName}</p>
                {identity.dateOfBirth && (
                  <p className="mt-1 text-sm text-foreground-muted">
                    {t("join.dateOfBirth")}: {identity.dateOfBirth}
                  </p>
                )}
                {developmentIdentity && (
                  <p className="mt-3 rounded-lg bg-[#FDF3E0] px-3 py-2 text-xs text-[#8A5A00] dark:bg-[#33240A] dark:text-[#FBBF24]">
                    No NIDA credentials are configured on this deployment, so this identity is a
                    development stub, not a real verification.
                  </p>
                )}
              </Card>
            )}

            <StepHeading icon={<Phone />} title={t("join.phoneStep")} body={t("join.phoneHelp")} />

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                {t("join.phoneLabel")}
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t("join.phonePlaceholder")}
                className="tnum h-13 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none transition-colors focus:border-kaa-400 focus:ring-2 focus:ring-kaa-500/25"
              />
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <Button type="submit" size="lg" className="w-full" disabled={busy || phone.replace(/\D/g, "").length < 9}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              {t("join.sendCode")}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={submitCode} className="space-y-5">
            <StepHeading icon={<Phone />} title={t("join.codeLabel")} body={t("join.codeSentTo", { phone })} />

            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="tnum h-16 w-full rounded-2xl border border-border bg-surface text-center text-3xl font-semibold tracking-[0.5em] outline-none transition-colors focus:border-kaa-400 focus:ring-2 focus:ring-kaa-500/25"
            />

            {!codeDelivered && (
              <p className="rounded-lg bg-[#FDF3E0] px-3 py-2 text-xs text-[#8A5A00] dark:bg-[#33240A] dark:text-[#FBBF24]">
                No SMS provider is configured on this deployment. The code is in the server log.
              </p>
            )}

            {error && <ErrorNote>{error}</ErrorNote>}

            <Button type="submit" size="lg" className="w-full" disabled={busy || code.length < 6}>
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              {t("join.verifyPhone")}
            </Button>

            <button
              type="button"
              onClick={() => requestCode()}
              disabled={busy}
              className="w-full py-2 text-center text-sm font-medium text-kaa-700 disabled:opacity-50 dark:text-kaa-400"
            >
              {t("join.resendCode")}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center pt-6 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400">
                <Check className="size-8" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">{t("join.accountReady")}</h2>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground-muted">
                {t("join.accountReadyBody")}
              </p>
            </div>

            {/* Verification and membership are separate. Saying so plainly here
                is what stops a tenant assuming they have already paid. */}
            <Card className="divide-y divide-border">
              <StatusRow label={t("join.statusNidaVerified")} value={t("join.statusActive")} done />
              <StatusRow label={t("join.statusPhoneVerified")} value={t("join.statusActive")} done />
              <StatusRow label={t("join.statusAccount")} value={t("join.statusActive")} done />
              <StatusRow label={t("join.statusSubscription")} value={t("join.statusNotActive")} />
            </Card>

            <Button size="lg" className="w-full" onClick={() => router.push("/app/search")}>
              {t("join.startSearching")}
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const index = { nida: 0, phone: 1, code: 1, done: 2 }[step];
  return (
    <div className="mt-5 flex gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= index ? "bg-kaa-500" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

function StepHeading({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <span className="flex size-11 items-center justify-center rounded-xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400 [&_svg]:size-5">
        {icon}
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{body}</p>
    </div>
  );
}

function StatusRow({ label, value, done }: { label: string; value: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className={cn("text-sm font-medium", done ? "text-[var(--color-success)]" : "text-foreground-subtle")}>
        {value}
      </span>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
      {children}
    </p>
  );
}
