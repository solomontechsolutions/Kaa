import { Award, Banknote, CheckCircle2, Clock, HandCoins, Smartphone } from "lucide-react";
import type { Metadata } from "next";

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { currentAgent, earningsSummary } from "@/lib/data/queries";
import { date, displayPhone, money } from "@/lib/format";
import type { EarningKind } from "@/lib/types";

export const metadata: Metadata = { title: "Earnings" };

const kindMeta: Record<EarningKind, { label: string; icon: React.ReactNode }> = {
  listing_verified: { label: "Verified listing", icon: <CheckCircle2 /> },
  rental_match: { label: "Rental match", icon: <HandCoins /> },
  bonus: { label: "Performance bonus", icon: <Award /> },
  adjustment: { label: "Adjustment", icon: <Banknote /> },
};

export default function EarningsPage() {
  const agent = currentAgent();
  const summary = earningsSummary();

  // Group the ledger by calendar month for a readable statement.
  const byMonth = summary.rows.reduce<Record<string, typeof summary.rows>>((acc, row) => {
    const key = new Date(row.earnedAt).toLocaleString("en", { month: "long", year: "numeric" });
    (acc[key] ??= []).push(row);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Earnings" description="Every shilling Kaa owes you, and what it was for." />

      {/* ── Balance ─────────────────────────────────────────────── */}
      <Card className="kaa-gradient border-0 p-5 text-ink-950">
        <p className="text-sm font-medium opacity-80">Unpaid balance</p>
        <p className="tnum mt-1 text-3xl font-semibold tracking-tight">{money(summary.pending)}</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-950/10 p-3">
          <Smartphone className="size-4 shrink-0" />
          <span className="text-sm">
            Pays out to <span className="font-semibold">{displayPhone(agent.payoutPhone)}</span>
          </span>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Approved" value={money(summary.approved)} sub="clears next payout run" icon={<Clock />} />
        <Stat label="Accrued" value={money(summary.accrued)} sub="awaiting review" />
        <Stat label="Paid out" value={money(summary.paid)} tone="brand" icon={<CheckCircle2 />} />
        <Stat label="Lifetime" value={money(summary.lifetime)} />
      </div>

      {/* ── Rate card ───────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>How you earn</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start justify-between gap-3">
              <span className="text-foreground-muted">Per verified listing approved</span>
              <span className="tnum shrink-0 font-semibold">{money(2000)}</span>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span className="text-foreground-muted">Per tenant who moves in</span>
              <span className="tnum shrink-0 font-semibold">{money(5000)}</span>
            </li>
            <li className="flex items-start justify-between gap-3 border-t border-border pt-3">
              <span className="text-foreground-muted">Monthly tier bonus</span>
              <span className="shrink-0 text-xs text-foreground-subtle">20+ approved listings</span>
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* ── Ledger ──────────────────────────────────────────────── */}
      {summary.rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={<Banknote />} title="No earnings yet" description="Approved listings show up here." />
        </div>
      ) : (
        Object.entries(byMonth).map(([month, rows]) => {
          const total = rows.reduce((sum, r) => sum + r.amount, 0);
          return (
            <Card key={month} className="mt-5">
              <CardHeader>
                <CardTitle>{month}</CardTitle>
                <Badge tone="outline" className="tnum">
                  {money(total)}
                </Badge>
              </CardHeader>
              <CardBody className="pt-3">
                <ul className="divide-y divide-border">
                  {rows.map((row) => (
                    <li key={row.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-subtle [&_svg]:size-4">
                        {kindMeta[row.kind].icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{kindMeta[row.kind].label}</p>
                        {row.note && <p className="mt-0.5 text-xs text-foreground-subtle">{row.note}</p>}
                        <p className="mt-1 text-xs text-foreground-subtle">
                          {date(row.earnedAt)}
                          {row.submissionRef && ` · ${row.submissionRef}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tnum text-sm font-semibold">{money(row.amount)}</p>
                        <div className="mt-1">
                          <StatusBadge kind="earning" value={row.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })
      )}
    </>
  );
}
