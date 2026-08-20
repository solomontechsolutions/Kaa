"use client";

import { ArrowLeft, Check, Images, Loader2, MapPin, MessageCircle, Bookmark, Phone, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button, Card } from "@/components/ui";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Stage = "offer" | "pending" | "confirmed" | "failed";

/**
 * Buying membership.
 *
 * This screen never grants anything. It starts a payment and then polls
 * `/api/subscription/status`, which reads the subscription rows — so the
 * unlock appears when the provider's webhook lands and not a moment before.
 * There is nothing to click here that changes what the tenant can see.
 */
export function UnlockFlow({
  locale,
  price,
  accountPhone,
  hasAccount,
  alreadyActive,
}: {
  locale: Locale;
  price: number;
  accountPhone?: string;
  hasAccount: boolean;
  alreadyActive: boolean;
}) {
  const router = useRouter();
  const t = React.useMemo(() => translator(locale), [locale]);

  const [stage, setStage] = React.useState<Stage>(alreadyActive ? "confirmed" : "offer");
  const [phone, setPhone] = React.useState(accountPhone ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [providerConfigured, setProviderConfigured] = React.useState(true);

  // Poll only while a payment is genuinely outstanding.
  React.useEffect(() => {
    if (stage !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/subscription/status", { cache: "no-store" });
        const payload = await response.json();
        if (payload.active) {
          setStage("confirmed");
          router.refresh();
        }
      } catch {
        /* keep polling, the next tick may succeed */
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [stage, router]);

  async function pay() {
    if (!hasAccount) {
      router.push("/app/join");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(
          payload.error === "verification_required"
            ? "Verify your NIDA number and phone first."
            : t("common.somethingWentWrong"),
        );
        return;
      }

      setProviderConfigured(payload.providerConfigured);
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      setStage("pending");
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("common.back")}
          className="flex size-10 items-center justify-center rounded-full bg-surface text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4.5" />
        </button>
      </header>

      {stage === "confirmed" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400">
            <Check className="size-8" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("paywall.paymentConfirmed")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            {t("paywall.paymentConfirmedBody")}
          </p>
          <Button size="lg" className="mt-8 w-full" onClick={() => router.push("/app/search")}>
            {t("join.startSearching")}
          </Button>
        </div>
      ) : stage === "pending" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Loader2 className="size-10 animate-spin text-kaa-500" />
          <h1 className="mt-6 text-xl font-semibold tracking-tight">{t("paywall.paymentPending")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
            {t("paywall.paymentPendingBody")}
          </p>
          {!providerConfigured && (
            <p className="mt-6 rounded-xl bg-[#FDF3E0] px-3.5 py-3 text-left text-xs leading-relaxed text-[#8A5A00] dark:bg-[#33240A] dark:text-[#FBBF24]">
              No payment provider is configured on this deployment, so nothing can confirm this
              payment. Membership stays inactive until a provider posts a signed confirmation to
              <code className="mx-1">/api/payments/webhook</code>.
            </p>
          )}
        </div>
      ) : (
        <div className="flex-1 pt-6">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-kaa-50 text-kaa-700 dark:bg-kaa-950 dark:text-kaa-400">
            <Sparkles className="size-5" />
          </span>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t("paywall.whyTitle")}</h1>

          <p className="tnum mt-4 text-3xl font-semibold text-kaa-700 dark:text-kaa-400">
            TSh {price.toLocaleString("en-US")}
            <span className="ml-1.5 text-sm font-normal text-foreground-subtle">
              / {t("paywall.forTwelveMonths")}
            </span>
          </p>

          <ul className="mt-7 space-y-3.5">
            <Perk icon={<Images />} text={t("paywall.whyPhotos")} />
            <Perk icon={<MapPin />} text={t("paywall.whyDetails")} />
            <Perk icon={<Phone />} text={t("paywall.whyContact")} />
            <Perk icon={<Bookmark />} text={t("paywall.whySave")} />
            <Perk icon={<Check />} text={t("paywall.whyViewing")} />
            <Perk icon={<MessageCircle />} text={t("paywall.whyEverywhere")} />
          </ul>

          <Card className="mt-8 p-5">
            <label htmlFor="pay-phone" className="mb-2 block text-sm font-medium">
              {t("paywall.payWith")}
            </label>
            <input
              id="pay-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07XXXXXXXX"
              className="tnum h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none transition-colors focus:border-kaa-400 focus:ring-2 focus:ring-kaa-500/25"
            />
          </Card>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={pay}
            disabled={busy || (hasAccount && phone.replace(/\D/g, "").length < 9)}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            {hasAccount ? t("paywall.payNow") : t("welcome.createAccount")}
          </Button>
        </div>
      )}
    </div>
  );
}

function Perk({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-kaa-700 dark:text-kaa-400 [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="text-sm leading-relaxed text-foreground-muted">{text}</span>
    </li>
  );
}
