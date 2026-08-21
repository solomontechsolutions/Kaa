import { Fingerprint, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { accountSummary, currentEntitlement } from "@/lib/access/session";
import { getAccount } from "@/lib/accounts/store";
import { getLease } from "@/lib/data/queries";
import { date, money } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { rentBreakdown } from "@/lib/pricing/service-charge";
import { initials } from "@/lib/utils";

export const metadata = { title: "You" };

export default async function AppTenancyPage() {
  const entitlement = await currentEntitlement();
  if (!entitlement.accountId) redirect("/app/welcome");

  const account = await getAccount(entitlement.accountId);
  if (!account) redirect("/app/welcome");

  const summary = await accountSummary(account);
  const { locale, t } = await getI18n();

  return (
    <div className="px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
      <div className="flex items-center gap-3.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-kaa-100 text-lg font-semibold text-kaa-800 dark:bg-kaa-900 dark:text-kaa-200">
          {summary.fullName ? initials(summary.fullName) : "Kaa"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {summary.fullName ?? t("account.title")}
          </h1>
          {summary.nidaVerified && (
            <Badge tone="success" className="mt-1">
              <ShieldCheck />
              {t("join.statusNidaVerified")}
            </Badge>
          )}
        </div>
      </div>

      <Card className="mt-6 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("account.verification")}
        </p>
        <ul className="mt-4 space-y-3">
          <Row
            icon={<Fingerprint />}
            label={t("account.nidaNumber")}
            // Masked. The number itself never reaches this page.
            value={summary.nidaMasked ?? "—"}
            done={summary.nidaVerified}
          />
          <Row
            icon={<Phone />}
            label={t("account.phoneNumber")}
            value={summary.phone ?? "—"}
            done={summary.phoneVerified}
          />
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("account.membership")}
        </p>
        {summary.membership.active ? (
          <>
            <Badge tone="brand" className="mt-3">
              <Sparkles />
              {t("join.statusActive")}
            </Badge>
            {summary.membership.endsAt && (
              <p className="mt-3 text-sm text-foreground-muted">
                {t("account.memberUntil", { date: date(summary.membership.endsAt) })}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-foreground-muted">{t("account.notAMember")}</p>
            <p className="tnum mt-3 text-lg font-semibold text-kaa-700 dark:text-kaa-400">
              {t("paywall.price")}
            </p>
            <ButtonLink href="/app/unlock" className="mt-4 w-full">
              {t("paywall.unlock")}
            </ButtonLink>
          </>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("common.language")}
        </p>
        <div className="mt-4">
          <LanguageSwitcher current={locale} variant="list" />
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("account.tenancy")}
        </p>
        {(() => {
          const lease = account.activeLeaseId ? getLease(account.activeLeaseId) : undefined;
          if (!lease) {
            return (
              <>
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{t("account.noTenancy")}</p>
                <ButtonLink href="/app/search" variant="outline" className="mt-5 w-full">
                  {t("account.findHome")}
                </ButtonLink>
              </>
            );
          }

          // The landlord's rent and Kaa's charge are computed here, from the
          // landlord's current rent, and never stored as one combined figure.
          const breakdown = rentBreakdown(lease.rentAmount);

          return (
            <div className="mt-3">
              <p className="text-sm font-medium">{lease.unit?.property.name ?? lease.reference}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-foreground-muted">{t("account.landlordRent")}</span>
                  <span className="tnum font-medium">{money(breakdown.baseRent)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-foreground-muted">
                    {t("account.kaaServiceCharge", { rate: String(breakdown.kaaServiceRate * 100) })}
                  </span>
                  <span className="tnum font-medium">{money(breakdown.kaaServiceCharge)}</span>
                </li>
                <li className="flex items-center justify-between border-t border-border pt-2 text-base">
                  <span className="font-semibold">{t("account.totalMonthlyPayment")}</span>
                  <span className="tnum font-semibold text-kaa-700 dark:text-kaa-400">
                    {money(breakdown.tenantTotal)}
                  </span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-foreground-subtle">{t("account.rentBreakdownNote")}</p>
            </div>
          );
        })()}
      </Card>

      <SignOutButton label={t("account.signOut")} />
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  done,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="tnum truncate text-xs text-foreground-subtle">{value}</p>
      </div>
      {done && <ShieldCheck className="size-4 shrink-0 text-[var(--color-success)]" />}
    </li>
  );
}
