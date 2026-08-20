import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, ButtonLink, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { agentToday, earningsSummary } from "@/lib/data/queries";
import { dateTime, displayPhone, money, relative } from "@/lib/format";

export const metadata: Metadata = { title: "Today" };

export default function FieldTodayPage() {
  const { agent, wardNames, viewings, drafts, awaitingReview, needsAttention, approvedThisMonth } = agentToday();
  const earnings = earningsSummary();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Habari za asubuhi" : hour < 16 ? "Habari za mchana" : "Habari za jioni";
  const firstName = agent.fullName.split(" ")[0];

  return (
    <>
      {/* ── Greeting ────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-sm text-foreground-muted">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight">{firstName}</h1>
      </div>

      {/* ── Earnings summary ────────────────────────────────────── */}
      <Card className="kaa-gradient overflow-hidden border-0 p-5 text-ink-950">
        <p className="text-sm font-medium opacity-80">Unpaid balance</p>
        <p className="tnum mt-1 text-3xl font-semibold tracking-tight">{money(earnings.pending)}</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span>
            <span className="opacity-75">Paid out </span>
            <span className="tnum font-semibold">{money(earnings.paid)}</span>
          </span>
          <span className="h-4 w-px bg-ink-950/20" />
          <Link href="/field/earnings" className="inline-flex items-center gap-1 font-medium hover:underline">
            Details <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Card>

      {/* ── Primary action ──────────────────────────────────────── */}
      <ButtonLink href="/field/capture" size="lg" variant="dark" className="mt-4 w-full">
        <Camera />
        Capture a new listing
      </ButtonLink>

      {/* ── Pipeline ────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Approved this month" value={approvedThisMonth} tone="brand" icon={<CheckCircle2 />} />
        <Stat label="Awaiting review" value={awaitingReview.length} icon={<Clock />} />
      </div>

      {/* ── Needs your attention ────────────────────────────────── */}
      {needsAttention.length > 0 && (
        <Card className="mt-5 border-[var(--color-warning)]/35">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-[var(--color-warning)]" />
              <CardTitle>Needs your attention</CardTitle>
            </div>
            <Badge tone="warning">{needsAttention.length}</Badge>
          </CardHeader>
          <CardBody className="pt-3">
            <ul className="space-y-3">
              {needsAttention.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/field/submissions/${s.id}`}
                    className="block rounded-xl border border-border p-3 transition-colors hover:border-kaa-300 hover:bg-surface"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.propertyName}</p>
                        <p className="tnum text-xs text-foreground-subtle">{s.reference}</p>
                      </div>
                      <StatusBadge kind="submission" value={s.status} />
                    </div>
                    {s.reviewNotes && (
                      <p className="mt-2 line-clamp-2 text-sm text-foreground-muted">{s.reviewNotes}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* ── Today's viewings ────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Viewings today</CardTitle>
          <Badge tone={viewings.length ? "info" : "neutral"}>{viewings.length}</Badge>
        </CardHeader>
        <CardBody className="pt-3">
          {viewings.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CalendarClock className="size-6 text-foreground-subtle" />
              <p className="mt-2 text-sm text-foreground-muted">No viewings scheduled today.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {viewings.map((v) => (
                <li key={v.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {v.unit?.property.name} · {v.unit?.label}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                        <MapPin className="size-3 shrink-0" />
                        {v.unit?.property.addressLine}
                      </p>
                    </div>
                    <span className="tnum shrink-0 text-sm font-medium">
                      {v.scheduledAt && dateTime(v.scheduledAt).split(", ")[1]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="min-w-0 text-sm">
                      <span className="font-medium">{v.requesterName}</span>
                    </span>
                    <a
                      href={`tel:${v.requesterPhone}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-kaa-50 px-2.5 py-1.5 text-xs font-medium text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300"
                    >
                      <Phone className="size-3.5" />
                      {displayPhone(v.requesterPhone)}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ── Drafts ──────────────────────────────────────────────── */}
      {drafts.length > 0 && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Unfinished drafts</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            <ul className="space-y-2">
              {drafts.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/field/submissions/${d.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong p-3 transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.propertyName}</p>
                      <p className="text-xs text-foreground-subtle">
                        {d.photoCount} photos · started {relative(d.capturedAt)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-foreground-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* ── Zones ───────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Your zones</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          <p className="text-sm text-foreground-muted">
            Saturate a few wards before spreading out. Density is what makes Kaa useful to tenants.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wardNames.map((ward) => (
              <Badge key={ward} tone="brand">
                <MapPin />
                {ward}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
