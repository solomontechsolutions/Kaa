/**
 * Read model for the Operators and Field Ops surfaces.
 *
 * Every page reads through this module rather than touching a data source
 * directly. Today it resolves against the seed dataset; when Supabase
 * credentials are present each function becomes a query against the schema in
 * `supabase/migrations/0001_init.sql` without any page changing.
 */

import {
  CURRENT_AGENT_ID,
  CURRENT_ORG_ID,
  agentEarnings,
  fieldAgents,
  leases,
  maintenanceRequests,
  organizations,
  payments,
  properties,
  rentInvoices,
  submissions,
  tenants,
  units,
  viewingRequests,
  wards,
} from "./seed";
import type {
  AgentEarning,
  FieldAgent,
  ListingSubmission,
  Property,
  RentInvoice,
  SubmissionStatus,
  Tenant,
  Unit,
  UnitStatus,
  UnitWithProperty,
} from "@/lib/types";

// ── Composition helpers ────────────────────────────────────────────────

export function currentOrg() {
  return organizations.find((o) => o.id === CURRENT_ORG_ID)!;
}

export function currentAgent(): FieldAgent {
  return fieldAgents.find((a) => a.id === CURRENT_AGENT_ID)!;
}

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getUnit(id: string): UnitWithProperty | undefined {
  const unit = units.find((u) => u.id === id);
  if (!unit) return undefined;
  const property = getProperty(unit.propertyId);
  if (!property) return undefined;
  return { ...unit, property };
}

export function unitsForProperty(propertyId: string): Unit[] {
  return units.filter((u) => u.propertyId === propertyId);
}

export function listProperties(orgId = CURRENT_ORG_ID) {
  return properties
    .filter((p) => p.orgId === orgId)
    .map((property) => {
      const own = unitsForProperty(property.id);
      const occupied = own.filter((u) => u.status === "occupied").length;
      const available = own.filter((u) => u.status === "available").length;
      const monthlyRent = own
        .filter((u) => u.status === "occupied")
        .reduce((sum, u) => sum + u.rentAmount, 0);
      return {
        ...property,
        units: own,
        unitCount: own.length,
        occupiedCount: occupied,
        availableCount: available,
        occupancyRate: own.length ? (occupied / own.length) * 100 : 0,
        monthlyRent,
        ward: property.ward,
      };
    });
}

export type PropertyRow = ReturnType<typeof listProperties>[number];

export function listUnits(orgId = CURRENT_ORG_ID): UnitWithProperty[] {
  const orgProps = new Map(properties.filter((p) => p.orgId === orgId).map((p) => [p.id, p]));
  return units
    .filter((u) => orgProps.has(u.propertyId))
    .map((u) => ({ ...u, property: orgProps.get(u.propertyId)! }));
}

// ── Tenants & leases ───────────────────────────────────────────────────

export function getTenant(id: string): Tenant | undefined {
  return tenants.find((t) => t.id === id);
}

export function listTenants(orgId = CURRENT_ORG_ID) {
  return tenants
    .filter((t) => t.orgId === orgId)
    .map((tenant) => {
      const tenantLeases = leases.filter((l) => l.tenantId === tenant.id);
      const active = tenantLeases.find((l) => l.status === "active" || l.status === "ending_soon");
      const unit = active ? getUnit(active.unitId) : undefined;
      const balance = rentInvoices
        .filter((i) => tenantLeases.some((l) => l.id === i.leaseId) && i.status === "overdue")
        .reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);
      return { ...tenant, lease: active, unit, arrears: balance, leaseCount: tenantLeases.length };
    });
}

export type TenantRow = ReturnType<typeof listTenants>[number];

export function listLeases(orgId = CURRENT_ORG_ID) {
  return leases
    .filter((l) => l.orgId === orgId)
    .map((lease) => ({
      ...lease,
      tenant: getTenant(lease.tenantId),
      unit: getUnit(lease.unitId),
      invoices: rentInvoices.filter((i) => i.leaseId === lease.id),
    }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export type LeaseRow = ReturnType<typeof listLeases>[number];

export function listInvoices(orgId = CURRENT_ORG_ID): RentInvoice[] {
  return [...rentInvoices]
    .filter((i) => i.orgId === orgId)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

export function listPayments(orgId = CURRENT_ORG_ID) {
  return [...payments]
    .filter((p) => p.orgId === orgId)
    .sort((a, b) => (b.settledAt ?? "").localeCompare(a.settledAt ?? ""))
    .map((payment) => {
      const invoice = rentInvoices.find((i) => i.id === payment.invoiceId);
      const lease = invoice ? leases.find((l) => l.id === invoice.leaseId) : undefined;
      return {
        ...payment,
        invoice,
        lease,
        tenant: lease ? getTenant(lease.tenantId) : undefined,
        unit: lease ? getUnit(lease.unitId) : undefined,
      };
    });
}

export type PaymentRow = ReturnType<typeof listPayments>[number];

// ── Demand ─────────────────────────────────────────────────────────────

export function listViewings(orgId = CURRENT_ORG_ID) {
  return viewingRequests
    .filter((v) => v.orgId === orgId)
    .map((v) => ({
      ...v,
      unit: getUnit(v.unitId),
      agent: fieldAgents.find((a) => a.id === v.assignedAgentId),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type ViewingRow = ReturnType<typeof listViewings>[number];

export function listMaintenance(orgId = CURRENT_ORG_ID) {
  const order: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return maintenanceRequests
    .filter((m) => m.orgId === orgId)
    .map((m) => ({ ...m, unit: getUnit(m.unitId) }))
    .sort((a, b) => order[a.priority] - order[b.priority] || b.createdAt.localeCompare(a.createdAt));
}

export type MaintenanceRow = ReturnType<typeof listMaintenance>[number];

// ── Field Ops ──────────────────────────────────────────────────────────

export function listSubmissions(agentId?: string): ListingSubmission[] {
  const rows = agentId ? submissions.filter((s) => s.agentId === agentId) : submissions;
  return [...rows].sort((a, b) => (b.submittedAt ?? b.capturedAt).localeCompare(a.submittedAt ?? a.capturedAt));
}

export function getSubmission(id: string): ListingSubmission | undefined {
  return submissions.find((s) => s.id === id || s.reference === id);
}

/** Submissions waiting on a human decision, oldest first, the review queue. */
export function reviewQueue(): ListingSubmission[] {
  const open: SubmissionStatus[] = ["submitted", "in_review"];
  return submissions
    .filter((s) => open.includes(s.status))
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
}

export function listAgents(): (FieldAgent & { wardNames: string[]; submissionCount: number; approvedCount: number })[] {
  return fieldAgents.map((agent) => {
    const own = submissions.filter((s) => s.agentId === agent.id);
    return {
      ...agent,
      wardNames: agent.zones.map((z) => wards.find((w) => w.id === z)?.name ?? z),
      submissionCount: own.length,
      approvedCount: own.filter((s) => s.status === "approved").length,
    };
  });
}

export function agentEarningsFor(agentId = CURRENT_AGENT_ID): AgentEarning[] {
  return agentEarnings
    .filter((e) => e.agentId === agentId)
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}

export function earningsSummary(agentId = CURRENT_AGENT_ID) {
  const rows = agentEarningsFor(agentId);
  const sum = (predicate: (e: AgentEarning) => boolean) =>
    rows.filter(predicate).reduce((total, e) => total + e.amount, 0);
  return {
    paid: sum((e) => e.status === "paid"),
    approved: sum((e) => e.status === "approved"),
    accrued: sum((e) => e.status === "accrued"),
    /** Approved but not yet disbursed, plus accrued, what the agent is owed. */
    pending: sum((e) => e.status === "approved" || e.status === "accrued"),
    lifetime: sum((e) => e.status !== "reversed"),
    rows,
  };
}

export function agentToday(agentId = CURRENT_AGENT_ID) {
  const agent = fieldAgents.find((a) => a.id === agentId)!;
  const mine = submissions.filter((s) => s.agentId === agentId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const viewings = viewingRequests
    .filter((v) => v.assignedAgentId === agentId && v.scheduledAt)
    .filter((v) => {
      const at = new Date(v.scheduledAt!).getTime();
      return at >= startOfDay.getTime() && at < endOfDay.getTime();
    })
    .map((v) => ({ ...v, unit: getUnit(v.unitId) }));

  return {
    agent,
    wardNames: agent.zones.map((z) => wards.find((w) => w.id === z)?.name ?? z),
    viewings,
    drafts: mine.filter((s) => s.status === "draft"),
    awaitingReview: mine.filter((s) => s.status === "submitted" || s.status === "in_review"),
    needsAttention: mine.filter((s) => s.status === "changes_requested"),
    approvedThisMonth: mine.filter(
      (s) => s.status === "approved" && new Date(s.reviewedAt ?? s.capturedAt).getMonth() === new Date().getMonth(),
    ).length,
  };
}

// ── Dashboard aggregates ───────────────────────────────────────────────

export function operatorOverview(orgId = CURRENT_ORG_ID) {
  const orgUnits = listUnits(orgId);
  const occupied = orgUnits.filter((u) => u.status === "occupied");
  const available = orgUnits.filter((u) => u.status === "available");
  const live = orgUnits.filter((u) => u.listingState === "live");

  const invoices = listInvoices(orgId);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const arrears = overdue.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const collectedThisMonth = payments
    .filter((p) => p.orgId === orgId && p.status === "succeeded" && (p.settledAt ?? "").startsWith(thisMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const expectedMonthly = occupied.reduce((sum, u) => sum + u.rentAmount, 0);

  const activeLeases = leases.filter((l) => l.orgId === orgId && (l.status === "active" || l.status === "ending_soon"));
  const expiringSoon = activeLeases.filter((l) => {
    const days = (new Date(l.endDate).getTime() - Date.now()) / 864e5;
    return days <= 60;
  });

  return {
    unitCount: orgUnits.length,
    propertyCount: properties.filter((p) => p.orgId === orgId).length,
    occupiedCount: occupied.length,
    availableCount: available.length,
    liveListingCount: live.length,
    occupancyRate: orgUnits.length ? (occupied.length / orgUnits.length) * 100 : 0,
    expectedMonthly,
    collectedThisMonth,
    collectionRate: expectedMonthly ? Math.min(100, (collectedThisMonth / expectedMonthly) * 100) : 0,
    arrears,
    overdueCount: overdue.length,
    activeLeaseCount: activeLeases.length,
    expiringSoon,
    tenantCount: tenants.filter((t) => t.orgId === orgId).length,
    openViewings: viewingRequests.filter((v) => v.orgId === orgId && v.status === "requested").length,
    openMaintenance: maintenanceRequests.filter(
      (m) => m.orgId === orgId && m.status !== "resolved" && m.status !== "closed",
    ).length,
    pendingApprovals: units.filter(
      (u) => u.listingState === "pending_review" && properties.find((p) => p.id === u.propertyId)?.orgId === orgId,
    ).length,
  };
}

/** Six months of collections, for the dashboard trend chart. */
export function collectionsTrend(orgId = CURRENT_ORG_ID) {
  const out: { month: string; expected: number; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const expected = rentInvoices
      .filter((inv) => inv.orgId === orgId && inv.dueDate.startsWith(key))
      .reduce((sum, inv) => sum + inv.amountDue, 0);
    const collected = payments
      .filter((p) => p.orgId === orgId && (p.settledAt ?? "").startsWith(key))
      .reduce((sum, p) => sum + p.amount, 0);
    out.push({
      month: d.toLocaleString("en", { month: "short" }),
      expected,
      collected,
    });
  }
  return out;
}

/** Unit counts by status, for the portfolio donut. */
export function unitStatusBreakdown(orgId = CURRENT_ORG_ID) {
  const counts = new Map<UnitStatus, number>();
  for (const u of listUnits(orgId)) counts.set(u.status, (counts.get(u.status) ?? 0) + 1);
  return [...counts.entries()].map(([status, count]) => ({ status, count }));
}

export { wards, fieldAgents, organizations };
