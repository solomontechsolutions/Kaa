"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { FieldOpsLockup } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button, Input } from "@/components/ui";
import { translator } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { FieldOpsEmployeeRole } from "@/lib/fieldops/types";
import { cn } from "@/lib/utils";

interface RosterEntry {
  employeeId: string;
  fullName: string;
  role: FieldOpsEmployeeRole;
}

/**
 * Signing in to FieldOps — employee id and a real password.
 *
 * Only two roles ever reach this form: a field officer, who lands on the
 * handset app, and a FieldOps supervisor/admin, who lands in the desktop
 * portal. There is no third option here — a Kaa operator is not a FieldOps
 * employee and does not appear on this roster or sign in through this form;
 * their sign-in is `/operators/sign-in`, on Kaa's own domain, against Kaa's
 * own employee table.
 */
export function SignInForm({ locale, roster }: { locale: Locale; roster: RosterEntry[] }) {
  const router = useRouter();
  const t = React.useMemo(() => translator(locale), [locale]);

  const [employeeId, setEmployeeId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/fieldops/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employeeId, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error === "inactive" ? t("fieldops.inactiveAccount") : t("fieldops.signInFailed"));
        return;
      }

      // A field officer collects on the handset; a supervisor/admin runs the
      // FieldOps desktop portal. Decided by the role on their record, not by
      // which URL they typed.
      router.push(payload.actor.role === "field_officer" ? "/field/app" : "/field");
      router.refresh();
    } catch {
      setError(t("common.somethingWentWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-16 items-center justify-between px-5 lg:px-8">
        <FieldOpsLockup compact />
        <LanguageSwitcher current={locale} />
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.signIn")}</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">{t("fieldops.strapline")}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="employee-id" className="mb-2 block text-sm font-medium">
                {t("fieldops.employeeId")}
              </label>
              <Input
                id="employee-id"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                autoComplete="username"
                placeholder="FO-0142"
                className="h-12"
              />
              <p className="mt-2 text-xs text-foreground-subtle">{t("fieldops.employeeIdHelp")}</p>
            </div>

            <div>
              <label htmlFor="employee-password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <Input
                id="employee-password"
                type="password"
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

            <Button type="submit" size="lg" className="w-full" disabled={busy || employeeId.trim().length < 2 || !password}>
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              {t("fieldops.signIn")}
            </Button>
          </form>

          {roster.length > 0 && (
            <div className="mt-10 rounded-2xl border border-border bg-surface-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Demo accounts
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
                Passwords are in the README, not shown here. Click a name to fill in the employee ID.
              </p>
              <ul className="mt-3 space-y-1">
                {roster.map((entry) => (
                  <li key={entry.employeeId}>
                    <button
                      type="button"
                      onClick={() => setEmployeeId(entry.employeeId)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface",
                        employeeId === entry.employeeId && "bg-surface",
                      )}
                    >
                      <span className="tnum font-medium">{entry.employeeId}</span>
                      <span className="truncate text-foreground-muted">{entry.fullName}</span>
                      <span className="ml-auto shrink-0 text-foreground-subtle">
                        {t(`fieldops.role.${entry.role}`)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
