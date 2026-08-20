import { CalendarCheck, CalendarClock, UserRoundCheck } from "lucide-react";
import type { Metadata } from "next";

import { Avatar, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { Stat, Thumb } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listViewings } from "@/lib/data/queries";
import { dateTime, displayPhone, money, relative } from "@/lib/format";

export const metadata: Metadata = { title: "Viewings" };

export default function ViewingsPage() {
  const viewings = listViewings();
  const requested = viewings.filter((v) => v.status === "requested");
  const scheduled = viewings.filter((v) => v.status === "scheduled");
  const past = viewings.filter((v) => v.status === "completed" || v.status === "no_show" || v.status === "cancelled");
  const completed = viewings.filter((v) => v.status === "completed").length;
  const noShows = viewings.filter((v) => v.status === "no_show").length;

  return (
    <>
      <PageHeader
        title="Viewings"
        description="Requests coming off the Kaa app, and the agents assigned to run them."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New requests" value={requested.length} tone={requested.length ? "warning" : "neutral"} icon={<CalendarClock />} />
        <Stat label="Scheduled" value={scheduled.length} icon={<CalendarCheck />} />
        <Stat label="Completed" value={completed} tone="brand" icon={<UserRoundCheck />} />
        <Stat
          label="No-show rate"
          value={`${past.length ? ((noShows / past.length) * 100).toFixed(0) : 0}%`}
          sub={`${noShows} of ${past.length} past viewings`}
          tone={noShows ? "warning" : "neutral"}
        />
      </div>

      {/* ── Needs assignment ────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Awaiting assignment</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">
              Route each request to the field agent covering that ward.
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          {requested.length === 0 ? (
            <EmptyState icon={<CalendarCheck />} title="Everything is assigned" description="No viewing requests are waiting." />
          ) : (
            <ul className="space-y-3">
              {requested.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3"
                >
                  <Thumb seed={v.unitId} className="h-14 w-20 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {v.unit?.property.name} · {v.unit?.label}
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {v.unit?.property.ward}, {v.unit?.property.district} · {v.unit && money(v.unit.rentAmount)}/month
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{v.requesterName}</p>
                    <p className="text-xs text-foreground-subtle">{displayPhone(v.requesterPhone)}</p>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="text-foreground-muted">Prefers</p>
                    <p className="font-medium">{v.preferredAt ? dateTime(v.preferredAt) : "Flexible"}</p>
                  </div>
                  <Button size="sm">Assign agent</Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ── Scheduled ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled</CardTitle>
            <Badge tone="info">{scheduled.length}</Badge>
          </CardHeader>
          <CardBody className="pt-3">
            {scheduled.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground-subtle">Nothing on the calendar.</p>
            ) : (
              <ul className="divide-y divide-border">
                {scheduled.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {v.agent && <Avatar name={v.agent.fullName} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {v.unit?.property.name} · {v.unit?.label}
                      </p>
                      <p className="text-xs text-foreground-subtle">
                        {v.requesterName} · {v.scheduledAt && dateTime(v.scheduledAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground-subtle">
                      {v.scheduledAt && relative(v.scheduledAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ── History ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Recent history</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            {past.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground-subtle">No past viewings.</p>
            ) : (
              <ul className="divide-y divide-border">
                {past.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{v.requesterName}</p>
                      <p className="truncate text-xs text-foreground-subtle">
                        {v.unit?.property.name} · {v.unit?.label} · {v.scheduledAt && relative(v.scheduledAt)}
                      </p>
                    </div>
                    <StatusBadge kind="viewing" value={v.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
