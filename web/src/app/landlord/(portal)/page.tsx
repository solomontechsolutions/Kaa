import { Building2, CalendarCheck, CheckCircle2, Wrench } from "lucide-react";

import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/actor";
import { getLandlord } from "@/lib/landlords/store";
import { getOrg, listMaintenance, listProperties, listViewings } from "@/lib/data/queries";
import { money, rent } from "@/lib/format";

export const metadata = { title: "Your properties" };

export default async function LandlordDashboard() {
  const actor = await requireRole("LANDLORD");
  const landlord = getLandlord(actor.id)!;
  const org = getOrg(landlord.orgId);

  const properties = listProperties(landlord.orgId);
  const viewings = listViewings(landlord.orgId);
  const maintenance = listMaintenance(landlord.orgId);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${landlord.fullName}`}
        description={org ? `${org.name} · ${properties.length} ${properties.length === 1 ? "property" : "properties"} on Kaa` : undefined}
      />

      {/* The one line every landlord screen exists to make unmistakable. */}
      <Card className="mb-6 flex items-center gap-3 border-kaa-200 bg-kaa-50 p-5 dark:border-kaa-900 dark:bg-kaa-950">
        <CheckCircle2 className="size-5 shrink-0 text-kaa-700 dark:text-kaa-400" />
        <p className="text-sm text-kaa-900 dark:text-kaa-200">
          <span className="font-semibold">Kaa does not charge you for listing or using the platform.</span>{" "}
          What you see below is your rent — nothing else. Kaa&rsquo;s service charge is handled separately
          with the tenant.
        </p>
      </Card>

      <div className="space-y-4">
        {properties.length === 0 && (
          <EmptyState icon={<Building2 />} title="No properties yet" description="Kaa Field Ops enrols your property when they visit — nothing to set up here." />
        )}

        {properties.map((property) => (
          <Card key={property.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{property.name}</h2>
                <p className="text-sm text-foreground-muted">
                  {property.ward}, {property.district}
                </p>
              </div>
              {property.isVerified && <Badge tone="success">Verified by Kaa</Badge>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Units" value={String(property.unitCount)} />
              <Stat label="Occupied" value={String(property.occupiedCount)} />
              <Stat label="Available" value={String(property.availableCount)} />
              <Stat label="Kaa charges you" value={money(0)} highlight />
            </div>

            <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
              {property.units.map((unit) => (
                <li key={unit.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{unit.label}</p>
                    <p className="text-xs text-foreground-subtle">
                      {unit.bedrooms} bed · {unit.bathrooms} bath
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tnum">{rent(unit.rentAmount)}</p>
                    <Badge tone={unit.status === "occupied" ? "brand" : unit.status === "available" ? "success" : "neutral"} className="mt-1">
                      {unit.status.replace("_", " ")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            <CalendarCheck className="size-4" /> Viewing activity
          </h3>
          {viewings.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">No viewing requests yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {viewings.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">{v.unit?.label ?? v.unitId}</span>
                  <Badge tone="outline">{v.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            <Wrench className="size-4" /> Maintenance
          </h3>
          {maintenance.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">Nothing open.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {maintenance.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">{m.title}</span>
                  <Badge tone="outline">{m.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">{label}</p>
      <p className={highlight ? "mt-1 text-lg font-semibold tnum text-kaa-700 dark:text-kaa-400" : "mt-1 text-lg font-semibold tnum"}>
        {value}
      </p>
    </div>
  );
}
