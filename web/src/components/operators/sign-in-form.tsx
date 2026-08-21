"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { KaaLockup } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button, Input } from "@/components/ui";
import { PasswordInput } from "@/components/ui/password-input";
import type { Locale } from "@/lib/i18n/config";

/**
 * Kaa staff sign-in. Employee id or email, plus a real password — this is
 * not FieldOps' sign-in form and does not share its roster: a Kaa operator's
 * identity lives in `lib/operators/`, a table FieldOps has no access to.
 */
export function OperatorSignInForm({ locale, demoEmployeeId }: { locale: Locale; demoEmployeeId?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/operators/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (!response.ok) {
        // A 5xx here means the server itself failed — most likely
        // KAA_SESSION_SECRET missing in production — not a wrong password.
        // Conflating the two is exactly what made a real misconfiguration
        // look like a typo in the credentials.
        setError(
          response.status >= 500
            ? "Sign-in is misconfigured on this deployment (server error, not a wrong password) — check /api/health."
            : "That employee ID or password is not right.",
        );
        return;
      }
      router.push("/operators");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center justify-between px-5 lg:px-8">
        <KaaLockup surface="Operators" />
        <LanguageSwitcher current={locale} />
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Kaa staff sign in</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Internal Kaa administration. Not for landlords or FieldOps employees.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="operator-identifier" className="mb-2 block text-sm font-medium">
                Employee ID or email
              </label>
              <Input
                id="operator-identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                placeholder={demoEmployeeId ?? "KAA-OP-001"}
                className="h-12"
              />
            </div>

            <div>
              <label htmlFor="operator-password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="operator-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-12"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-sm text-[#A61B2B] dark:bg-[#37151A] dark:text-[#FB7185]">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy || !identifier || !password}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Sign in
            </Button>
          </form>

          {demoEmployeeId && (
            <div className="mt-10 rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Demo account
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
                Employee ID <span className="font-medium text-foreground">{demoEmployeeId}</span>. The
                password is in the README — this is a demo deployment, so it is documented there rather
                than shown on a sign-in screen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
