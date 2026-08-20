import { FileSignature, Plus } from "lucide-react";
import type { Metadata } from "next";

import { Badge, ButtonLink, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listLeases } from "@/lib/data/queries";
import { date, money, relative } from "@/lib/format";

export const metadata: Metadata = { title: "Leases" };

/** Days until a lease ends — negative once it has passed. */
function daysLeft(endDate: string) {
  return Math.round((new Date(endDate).getTime() - Date.now()) / 864e5);
}

export default function LeasesPage() {
  const leases = listLeases();
  const active = leases.filter((l) => l.status === "active" || l.status === "ending_soon");
  const awaiting = leases.filter((l) => l.status === "pending_signature");
  const expiring = active.filter((l) => daysLeft(l.endDate) <= 60);
  const contracted = active.reduce((sum, l) => sum + l.rentAmount, 0);

  return (
    <>
      <PageHeader
        title="Leases"
        description="Every tenancy agreement, its term, and what it is worth."
        action={
          <ButtonLink href="/operators/leases/new">
            <Plus />
            New lease
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active leases" value={active.length} />
        <Stat label="Contracted monthly" value={money(contracted)} tone="brand" />
        <Stat
          label="Expiring within 60 days"
          value={expiring.length}
          tone={expiring.length ? "warning" : "neutral"}
          sub="start renewal conversations"
        />
        <Stat label="Awaiting signature" value={awaiting.length} tone={awaiting.length ? "warning" : "neutral"} />
      </div>

      <Card className="mt-6 p-0">
        {leases.length === 0 ? (
          <EmptyState icon={<FileSignature />} title="No leases yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Reference</Th>
                <Th>Tenant & unit</Th>
                <Th>Term</Th>
                <Th className="text-right">Rent</Th>
                <Th className="text-right">Deposit</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease) => {
                const left = daysLeft(lease.endDate);
                return (
                  <Tr key={lease.id}>
                    <Td>
                      <span className="tnum text-xs font-medium text-foreground-muted">{lease.reference}</span>
                      {lease.matchedByAgentId && (
                        <Badge tone="outline" className="ml-2">
                          Agent match
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <p className="font-medium">{lease.tenant?.fullName}</p>
                      <p className="text-xs text-foreground-subtle">
                        {lease.unit?.property.name} · {lease.unit?.label}
                      </p>
                    </Td>
                    <Td>
                      <p className="text-sm">
                        {date(lease.startDate)} → {date(lease.endDate)}
                      </p>
                      <p
                        className={
                          left <= 60 && left >= 0
                            ? "text-xs font-medium text-[var(--color-warning)]"
                            : "text-xs text-foreground-subtle"
                        }
                      >
                        {left >= 0 ? `Ends ${relative(lease.endDate)}` : `Ended ${relative(lease.endDate)}`}
                      </p>
                    </Td>
                    <Td className="tnum text-right font-medium">{money(lease.rentAmount)}</Td>
                    <Td className="tnum text-right text-foreground-muted">{money(lease.depositAmount)}</Td>
                    <Td>
                      <StatusBadge kind="lease" value={lease.status} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
