import { Building2, MapPin, Plus, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge, ButtonLink, Card, PageHeader, Progress } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { listProperties } from "@/lib/data/queries";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  const properties = listProperties();

  const totals = properties.reduce(
    (acc, p) => ({
      units: acc.units + p.unitCount,
      occupied: acc.occupied + p.occupiedCount,
      rent: acc.rent + p.monthlyRent,
    }),
    { units: 0, occupied: 0, rent: 0 },
  );

  return (
    <>
      <PageHeader
        title="Properties"
        description={`${properties.length} properties · ${totals.units} units · ${money(totals.rent)} contracted monthly`}
        action={
          <ButtonLink href="/operators/properties/new">
            <Plus />
            Add property
          </ButtonLink>
        }
      />

      {properties.length === 0 ? (
        <Card className="p-0">
          <div className="p-12 text-center">
            <Building2 className="mx-auto size-8 text-foreground-subtle" />
            <p className="mt-3 font-medium">No properties yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/operators/properties/${property.id}`} className="group">
              <Card interactive className="h-full overflow-hidden p-0">
                <div className="relative">
                  <Thumb seed={property.id} className="h-40 w-full rounded-none" />
                  <div className="absolute right-3 top-3 flex gap-2">
                    {property.isVerified ? (
                      <Badge tone="brand" className="bg-white/90 backdrop-blur-sm dark:bg-ink-900/90">
                        <ShieldCheck />
                        Verified
                      </Badge>
                    ) : (
                      <Badge tone="warning" className="backdrop-blur-sm">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="truncate font-semibold tracking-tight transition-colors group-hover:text-kaa-700 dark:group-hover:text-kaa-400">
                    {property.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {property.ward}, {property.district}
                    </span>
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="tnum text-sm font-medium">
                      {property.occupiedCount}
                      <span className="text-foreground-subtle">/{property.unitCount} occupied</span>
                    </span>
                    <span className="tnum text-sm font-semibold text-kaa-700 dark:text-kaa-400">
                      {property.occupancyRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={property.occupancyRate} className="mt-2" />

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="text-foreground-muted">Monthly rent roll</span>
                    <span className="tnum font-semibold">{money(property.monthlyRent)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
