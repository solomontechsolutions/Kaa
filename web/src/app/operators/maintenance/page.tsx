import { CheckCircle2, Plus, Wrench } from "lucide-react";
import type { Metadata } from "next";

import { Button, ButtonLink, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listMaintenance } from "@/lib/data/queries";
import { relative } from "@/lib/format";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  const requests = listMaintenance();
  const open = requests.filter((m) => m.status !== "resolved" && m.status !== "closed");
  const urgent = open.filter((m) => m.priority === "urgent" || m.priority === "high");
  const resolved = requests.filter((m) => m.status === "resolved" || m.status === "closed");

  /** Mean days from raised to resolved, over the closed set. */
  const avgResolution = resolved.length
    ? resolved.reduce(
        (sum, m) => sum + (new Date(m.resolvedAt ?? m.createdAt).getTime() - new Date(m.createdAt).getTime()) / 864e5,
        0,
      ) / resolved.length
    : 0;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Faults raised by tenants and caretakers, ordered by urgency."
        action={
          <ButtonLink href="/operators/maintenance/new">
            <Plus />
            Log a fault
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open" value={open.length} tone={open.length ? "warning" : "neutral"} icon={<Wrench />} />
        <Stat label="Urgent or high" value={urgent.length} tone={urgent.length ? "danger" : "neutral"} />
        <Stat label="Resolved" value={resolved.length} tone="brand" icon={<CheckCircle2 />} />
        <Stat label="Avg. resolution" value={`${avgResolution.toFixed(1)} days`} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Open faults</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          {open.length === 0 ? (
            <EmptyState icon={<CheckCircle2 />} title="Nothing outstanding" description="Every reported fault has been resolved." />
          ) : (
            <ul className="space-y-3">
              {open.map((m) => (
                <li key={m.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{m.title}</p>
                        <StatusBadge kind="priority" value={m.priority} />
                        <StatusBadge kind="maintenance" value={m.status} />
                      </div>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        {m.reference} · {m.unit?.property.name} · {m.unit?.label} · raised {relative(m.createdAt)}
                      </p>
                      {m.description && (
                        <p className="mt-2 max-w-2xl text-sm text-foreground-muted">{m.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Assign
                      </Button>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {resolved.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recently resolved</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            <ul className="divide-y divide-border">
              {resolved.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.title}</p>
                    <p className="truncate text-xs text-foreground-subtle">
                      {m.unit?.property.name} · {m.unit?.label} · closed {m.resolvedAt && relative(m.resolvedAt)}
                    </p>
                  </div>
                  <StatusBadge kind="maintenance" value={m.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </>
  );
}
