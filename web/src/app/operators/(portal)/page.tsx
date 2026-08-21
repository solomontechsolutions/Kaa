import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  DoorOpen,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CollectionsChart } from "@/components/operators/collections-chart";
import { Badge, ButtonLink, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Progress } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import {
  collectionsTrend,
  currentOrg,
  listMaintenance,
  listViewings,
  operatorOverview,
  unitStatusBreakdown,
} from "@/lib/data/queries";
import { date, money, moneyCompact, relative } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function OperatorsDashboard() {
  const org = currentOrg();
  const overview = operatorOverview();
  const trend = collectionsTrend();
  const breakdown = unitStatusBreakdown();
  const viewings = listViewings().filter((v) => v.status === "requested" || v.status === "scheduled").slice(0, 5);
  const maintenance = listMaintenance().filter((m) => m.status !== "resolved" && m.status !== "closed").slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Habari za asubuhi" : hour < 16 ? "Habari za mchana" : "Habari za jioni";

  return (
    <>
      <PageHeader
        title={`${greeting}, Ally`}
        description={`Here is how ${org.name} is doing today.`}
        action={
          <ButtonLink href="/operators/properties/new" variant="primary">
            <Building2 />
            Add property
          </ButtonLink>
        }
      />

      {/* ── Headline numbers ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Expected this month"
          value={money(overview.expectedMonthly)}
          sub={`${overview.occupiedCount} occupied units`}
          icon={<Banknote />}
        />
        <Stat
          label="Collected this month"
          value={money(overview.collectedThisMonth)}
          sub={`${overview.collectionRate.toFixed(0)}% of expected`}
          icon={<TrendingUp />}
          tone="brand"
        />
        <Stat
          label="Rent in arrears"
          value={money(overview.arrears)}
          sub={`${overview.overdueCount} overdue invoices`}
          icon={<AlertTriangle />}
          tone={overview.arrears > 0 ? "danger" : "neutral"}
        />
        <Stat
          label="Occupancy"
          value={`${overview.occupancyRate.toFixed(0)}%`}
          sub={`${overview.availableCount} units available`}
          icon={<DoorOpen />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* ── Collections trend ───────────────────────────────── */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Rent collection</CardTitle>
              <p className="mt-1 text-sm text-foreground-muted">
                Invoiced against settled, last six months
              </p>
            </div>
            <Badge tone="brand">{moneyCompact(overview.collectedThisMonth)} this month</Badge>
          </CardHeader>
          <CardBody>
            <CollectionsChart data={trend} />
          </CardBody>
        </Card>

        {/* ── Portfolio mix ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {breakdown
              .sort((a, b) => b.count - a.count)
              .map(({ status, count }) => (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <StatusBadge kind="unit" value={status} />
                    <span className="tnum text-sm font-medium">
                      {count}
                      <span className="ml-1 text-xs font-normal text-foreground-subtle">
                        of {overview.unitCount}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={(count / overview.unitCount) * 100}
                    tone={status === "maintenance" ? "warning" : "brand"}
                  />
                </div>
              ))}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Live on Kaa</span>
                <span className="tnum font-medium">{overview.liveListingCount} listings</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-foreground-muted">Active leases</span>
                <span className="tnum font-medium">{overview.activeLeaseCount}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ── Viewings ────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Viewing requests</CardTitle>
            <Link
              href="/operators/viewings"
              className="inline-flex items-center gap-1 text-sm font-medium text-kaa-700 hover:underline dark:text-kaa-400"
            >
              All viewings <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="pt-3">
            {viewings.length === 0 ? (
              <EmptyState icon={<CalendarClock />} title="No open viewing requests" />
            ) : (
              <ul className="divide-y divide-border">
                {viewings.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {v.requesterName}
                        <span className="ml-2 font-normal text-foreground-muted">
                          {v.unit?.property.name} · {v.unit?.label}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        {v.scheduledAt ? `Scheduled ${relative(v.scheduledAt)}` : `Requested ${relative(v.createdAt)}`}
                        {v.agent && ` · ${v.agent.fullName}`}
                      </p>
                    </div>
                    <StatusBadge kind="viewing" value={v.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── Needs attention ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 pt-3">
            {overview.expiringSoon.length > 0 && (
              <Link
                href="/operators/leases"
                className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:border-kaa-300 hover:bg-surface"
              >
                <span className="mt-0.5 text-[var(--color-warning)]">
                  <CalendarClock className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {overview.expiringSoon.length} lease{overview.expiringSoon.length > 1 ? "s" : ""} ending soon
                  </span>
                  <span className="block text-xs text-foreground-subtle">
                    Earliest {date(overview.expiringSoon[0]!.endDate)}, start renewals now
                  </span>
                </span>
              </Link>
            )}

            {maintenance.map((m) => (
              <Link
                key={m.id}
                href="/operators/maintenance"
                className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:border-kaa-300 hover:bg-surface"
              >
                <span className="mt-0.5 text-foreground-subtle">
                  <Wrench className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.title}</span>
                  <span className="block truncate text-xs text-foreground-subtle">
                    {m.unit?.property.name} · {m.unit?.label} · {relative(m.createdAt)}
                  </span>
                </span>
                <StatusBadge kind="priority" value={m.priority} />
              </Link>
            ))}

            {overview.pendingApprovals > 0 && (
              <Link
                href="/operators/listings"
                className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:border-kaa-300 hover:bg-surface"
              >
                <span className="mt-0.5 text-foreground-subtle">
                  <Building2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {overview.pendingApprovals} listing{overview.pendingApprovals > 1 ? "s" : ""} awaiting review
                  </span>
                  <span className="block text-xs text-foreground-subtle">Approve to publish on the Kaa app</span>
                </span>
              </Link>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
