import { Phone, Plus, UserRoundPlus } from "lucide-react";
import type { Metadata } from "next";

import { Avatar, ButtonLink, Card, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listTenants } from "@/lib/data/queries";
import { date, displayPhone, money } from "@/lib/format";

export const metadata: Metadata = { title: "Tenants" };

export default function TenantsPage() {
  const tenants = listTenants();
  const verified = tenants.filter((t) => t.nidaStatus === "verified").length;
  const inArrears = tenants.filter((t) => t.arrears > 0);
  const totalArrears = inArrears.reduce((sum, t) => sum + t.arrears, 0);

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Everyone renting from you, with their unit, lease and standing."
        action={
          <ButtonLink href="/operators/tenants/new">
            <Plus />
            Add tenant
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tenants" value={tenants.length} />
        <Stat
          label="NIDA verified"
          value={`${verified}/${tenants.length}`}
          sub={`${((verified / tenants.length) * 100).toFixed(0)}% of your book`}
          tone="brand"
        />
        <Stat label="In arrears" value={inArrears.length} tone={inArrears.length ? "danger" : "neutral"} />
        <Stat label="Total owed" value={money(totalArrears)} tone={totalArrears ? "danger" : "neutral"} />
      </div>

      <Card className="mt-6 p-0">
        {tenants.length === 0 ? (
          <EmptyState
            icon={<UserRoundPlus />}
            title="No tenants yet"
            description="Add a tenant manually, or let a signed lease create one for you."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tenant</Th>
                <Th>Unit</Th>
                <Th>Lease ends</Th>
                <Th>Identity</Th>
                <Th className="text-right">Arrears</Th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={tenant.fullName} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tenant.fullName}</p>
                        <a
                          href={`tel:${tenant.phone}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-foreground-subtle hover:text-kaa-700 dark:hover:text-kaa-400"
                        >
                          <Phone className="size-3" />
                          {displayPhone(tenant.phone)}
                        </a>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {tenant.unit ? (
                      <>
                        <p className="text-sm font-medium">{tenant.unit.label}</p>
                        <p className="text-xs text-foreground-subtle">{tenant.unit.property.name}</p>
                      </>
                    ) : (
                      <span className="text-sm text-foreground-subtle">No active unit</span>
                    )}
                  </Td>
                  <Td>
                    {tenant.lease ? (
                      <>
                        <p className="text-sm">{date(tenant.lease.endDate)}</p>
                        <StatusBadge kind="lease" value={tenant.lease.status} />
                      </>
                    ) : (
                      <span className="text-sm text-foreground-subtle">-</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge kind="verification" value={tenant.nidaStatus} />
                  </Td>
                  <Td className="text-right">
                    {tenant.arrears > 0 ? (
                      <span className="tnum font-semibold text-[var(--color-danger)]">
                        {money(tenant.arrears)}
                      </span>
                    ) : (
                      <span className="text-sm text-foreground-subtle">Up to date</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
