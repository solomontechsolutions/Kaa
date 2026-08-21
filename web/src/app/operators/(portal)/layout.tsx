import {
  Banknote,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileSignature,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { KaaLockup } from "@/components/brand/logo";
import { OperatorIdentity } from "@/components/operators/sign-out-link";
import { SidebarLink, TabLink } from "@/components/shell/nav-link";
import { Avatar, Badge, Input } from "@/components/ui";
import { requireRole } from "@/lib/auth/actor";
import { currentOrg, operatorOverview } from "@/lib/data/queries";
import { findSubmissions } from "@/lib/fieldops/service";

/** The portals are working tools, not marketing surfaces, keep them out of search. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * `requireRole` here is the friendly failure mode, not the enforcement — it
 * redirects a wrong-role visitor with a normal navigation rather than a raw
 * 403. The actual backend rule lives in `proxy.ts`, which runs ahead of this
 * layout and its page rendering in parallel and would otherwise let the page
 * paint for one tick regardless of what this redirect decides.
 */
export default async function OperatorsLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("KAA_OPERATOR");
  const org = currentOrg();
  const overview = operatorOverview();
  const pendingFieldOps = findSubmissions(
    { id: actor.id, name: actor.name ?? "Kaa operator", role: "kaa_operator" },
    { status: ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"] },
  ).length;

  return (
    <div className="flex min-h-dvh bg-surface">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface-raised lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/operators" className="text-foreground">
            <KaaLockup surface="Operators" />
          </Link>
        </div>

        <div className="border-b border-border px-4 py-3.5">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">Organisation</p>
          <div className="mt-2 flex items-center gap-2.5">
            <Avatar name={org.name} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{org.name}</p>
              <p className="text-xs text-foreground-subtle">
                {overview.propertyCount} properties · {overview.unitCount} units
              </p>
            </div>
          </div>
          {org.isVerified && (
            <Badge tone="brand" className="mt-2.5">
              <ShieldCheck />
              Verified operator
            </Badge>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarLink href="/operators" icon={<LayoutDashboard />} label="Dashboard" exact />
          <SidebarLink href="/operators/properties" icon={<Building2 />} label="Properties" />
          <SidebarLink href="/operators/listings" icon={<ListChecks />} label="Listings" badge={overview.pendingApprovals} />
          <SidebarLink href="/operators/viewings" icon={<CalendarCheck />} label="Viewings" badge={overview.openViewings} />

          <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Tenancies
          </p>
          <SidebarLink href="/operators/tenants" icon={<UsersRound />} label="Tenants" />
          <SidebarLink href="/operators/leases" icon={<FileSignature />} label="Leases" />
          <SidebarLink href="/operators/payments" icon={<Banknote />} label="Rent & payments" badge={overview.overdueCount} />
          <SidebarLink href="/operators/maintenance" icon={<Wrench />} label="Maintenance" badge={overview.openMaintenance} />

          <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Network
          </p>
          <SidebarLink href="/operators/agents" icon={<ShieldCheck />} label="Field agents" />
          {/* FieldOps is a separate entity — its own portal, its own staff.
              This is Kaa's side of the review: the only place a Kaa operator
              approves or sends back a FieldOps submission. */}
          <SidebarLink href="/operators/fieldops" icon={<ClipboardCheck />} label="FieldOps submissions" badge={pendingFieldOps} />
          <SidebarLink href="/operators/settings" icon={<Settings />} label="Settings" />
        </nav>

        <div className="border-t border-border p-3">
          <OperatorIdentity name={actor.name ?? "Kaa operator"} />
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface-raised/85 px-4 backdrop-blur-md lg:px-8">
          <Link href="/operators" className="lg:hidden">
            <KaaLockup surface="Operators" />
          </Link>
          <div className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
            <Input placeholder="Search properties, tenants, references…" className="h-10 pl-9" />
          </div>
          <Badge tone="outline" className="hidden sm:inline-flex">
            {overview.occupancyRate.toFixed(0)}% occupied
          </Badge>
          <Avatar name={actor.name ?? "Kaa operator"} className="lg:hidden" />
        </header>

        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-10">{children}</main>

        {/* Compact nav for narrow screens */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface-raised/95 backdrop-blur-md lg:hidden">
          <TabLink href="/operators" icon={<LayoutDashboard />} label="Home" exact />
          <TabLink href="/operators/properties" icon={<Building2 />} label="Properties" />
          <TabLink href="/operators/tenants" icon={<UsersRound />} label="Tenants" />
          <TabLink href="/operators/payments" icon={<Banknote />} label="Rent" />
          <TabLink href="/operators/settings" icon={<Settings />} label="More" />
        </nav>
      </div>
    </div>
  );
}
