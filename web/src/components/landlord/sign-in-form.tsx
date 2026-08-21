"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { KaaLockup } from "@/components/brand/logo";
import { Button, Input } from "@/components/ui";

/**
 * Landlord sign-in: phone, then the code sent to it.
 *
 * There is no landlord sign-up here, deliberately — a landlord becomes one
 * when Kaa Field Ops enrols their property, not by registering on this site.
 * A phone that is not on a landlord record says so rather than pretending a
 * code was sent, the same honesty the tenant NIDA flow already uses.
 */
export function LandlordSignInForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<"phone" | "code">("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devHint, setDevHint] = React.useState<string | null>(null);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/landlords/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(
          payload.error === "not_a_landlord"
            ? "That number isn't enrolled as a Kaa landlord yet."
            : payload.error === "rate_limited"
              ? "Too many attempts — try again in a few minutes."
              : "That doesn't look like a valid number.",
        );
        return;
      }
      if (!payload.delivered) {
        setDevHint("No SMS provider is configured on this deployment — the code was written to the server log.");
      }
      setStep("code");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/landlords/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(
          payload.error === "incorrect"
            ? "That code is not right."
            : payload.error === "expired"
              ? "That code has expired — request a new one."
              : "Sign in failed.",
        );
        return;
      }
      router.push("/landlord");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center px-5 lg:px-8">
        <KaaLockup surface="Landlord" />
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Landlord sign in</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            {step === "phone"
              ? "Enter the phone number Kaa Field Ops enrolled for your property."
              : `Enter the code sent to ${phone}.`}
          </p>

          {step === "phone" ? (
            <form onSubmit={requestCode} className="mt-8 space-y-4">
              <div>
                <label htmlFor="landlord-phone" className="mb-2 block text-sm font-medium">
                  Phone number
                </label>
                <Input
                  id="landlord-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="0700 000 102"
                  className="h-12"
                />
              </div>
              {error && <ErrorText>{error}</ErrorText>}
              <Button type="submit" size="lg" className="w-full" disabled={busy || phone.trim().length < 9}>
                {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                Send code
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-8 space-y-4">
              <div>
                <label htmlFor="landlord-code" className="mb-2 block text-sm font-medium">
                  Code
                </label>
                <Input
                  id="landlord-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="h-12"
                />
                {devHint && <p className="mt-2 text-xs text-foreground-subtle">{devHint}</p>}
              </div>
              {error && <ErrorText>{error}</ErrorText>}
              <Button type="submit" size="lg" className="w-full" disabled={busy || code.trim().length < 4}>
                {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                Sign in
              </Button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-center text-sm text-foreground-muted hover:text-foreground"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
      {children}
    </p>
  );
}
