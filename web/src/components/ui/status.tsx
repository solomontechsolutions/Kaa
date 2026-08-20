/**
 * Domain status → visual tone.
 *
 * One place decides what "overdue" or "changes_requested" looks like, so the
 * Operators and Field Ops surfaces never drift apart.
 */

import { Badge } from "./index";
import type {
  InvoiceStatus,
  LeaseStatus,
  ListingState,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentStatus,
  SubmissionStatus,
  UnitStatus,
  VerificationStatus,
  ViewingStatus,
  EarningStatus,
} from "@/lib/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "outline";
type Spec = { label: string; tone: Tone };

const unit: Record<UnitStatus, Spec> = {
  draft: { label: "Draft", tone: "neutral" },
  available: { label: "Available", tone: "success" },
  reserved: { label: "Reserved", tone: "info" },
  occupied: { label: "Occupied", tone: "brand" },
  maintenance: { label: "Maintenance", tone: "warning" },
  off_market: { label: "Off market", tone: "neutral" },
};

const listing: Record<ListingState, Spec> = {
  unlisted: { label: "Not listed", tone: "neutral" },
  pending_review: { label: "Pending review", tone: "warning" },
  live: { label: "Live", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "neutral" },
  paused: { label: "Paused", tone: "info" },
};

const submission: Record<SubmissionStatus, Spec> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  in_review: { label: "In review", tone: "warning" },
  changes_requested: { label: "Changes needed", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

const lease: Record<LeaseStatus, Spec> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_signature: { label: "Awaiting signature", tone: "warning" },
  active: { label: "Active", tone: "success" },
  ending_soon: { label: "Ending soon", tone: "warning" },
  ended: { label: "Ended", tone: "neutral" },
  terminated: { label: "Terminated", tone: "danger" },
};

const invoice: Record<InvoiceStatus, Spec> = {
  pending: { label: "Pending", tone: "neutral" },
  partial: { label: "Part paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  waived: { label: "Waived", tone: "info" },
};

const payment: Record<PaymentStatus, Spec> = {
  initiated: { label: "Initiated", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  refunded: { label: "Refunded", tone: "info" },
};

const viewing: Record<ViewingStatus, Spec> = {
  requested: { label: "New request", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  no_show: { label: "No show", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const maintenance: Record<MaintenanceStatus, Spec> = {
  open: { label: "Open", tone: "danger" },
  acknowledged: { label: "Acknowledged", tone: "warning" },
  in_progress: { label: "In progress", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

const priority: Record<MaintenancePriority, Spec> = {
  low: { label: "Low", tone: "neutral" },
  normal: { label: "Normal", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

const verification: Record<VerificationStatus, Spec> = {
  unverified: { label: "Not verified", tone: "neutral" },
  pending: { label: "Verifying", tone: "warning" },
  verified: { label: "NIDA verified", tone: "success" },
  failed: { label: "Verification failed", tone: "danger" },
  expired: { label: "Expired", tone: "warning" },
};

const earning: Record<EarningStatus, Spec> = {
  accrued: { label: "Accrued", tone: "neutral" },
  approved: { label: "Approved", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  reversed: { label: "Reversed", tone: "danger" },
};

const registry = {
  unit,
  listing,
  submission,
  lease,
  invoice,
  payment,
  viewing,
  maintenance,
  priority,
  verification,
  earning,
} as const;

type Kind = keyof typeof registry;

export function StatusBadge({ kind, value }: { kind: Kind; value: string }) {
  const spec = (registry[kind] as Record<string, Spec>)[value] ?? { label: value, tone: "neutral" as Tone };
  return <Badge tone={spec.tone}>{spec.label}</Badge>;
}

export function statusLabel(kind: Kind, value: string) {
  return (registry[kind] as Record<string, Spec>)[value]?.label ?? value;
}
