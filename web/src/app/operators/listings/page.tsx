import { Eye, Globe, ListChecks, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Table, Td, Th, Tr } from "@/components/ui";
import { Stat, Thumb } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { listUnits } from "@/lib/data/queries";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Listings" };

export default function ListingsPage() {
  const units = listUnits();
  const pending = units.filter((u) => u.listingState === "pending_review");
  const live = units.filter((u) => u.listingState === "live");
  const paused = units.filter((u) => u.listingState === "paused");
  const unlisted = units.filter((u) => u.status === "available" && u.listingState === "unlisted");

  const totalViews = live.reduce((sum, u) => sum + u.viewCount, 0);

  return (
    <>
      <PageHeader
        title="Listings"
        description="What tenants see on the Kaa app — and what is waiting on your approval."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Live on Kaa" value={live.length} tone="brand" icon={<Globe />} />
        <Stat label="Awaiting approval" value={pending.length} tone={pending.length ? "warning" : "neutral"} icon={<ListChecks />} />
        <Stat label="Views this cycle" value={totalViews.toLocaleString()} icon={<Eye />} />
        <Stat
          label="Available but unlisted"
          value={unlisted.length}
          tone={unlisted.length ? "warning" : "neutral"}
          sub="empty units nobody can find"
        />
      </div>

      {/* ── Approval queue ──────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Awaiting approval</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">
              Approving publishes the unit to the Kaa app with a verified badge.
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          {pending.length === 0 ? (
            <EmptyState icon={<ShieldCheck />} title="Nothing waiting" description="Every submitted listing has been reviewed." />
          ) : (
            <ul className="space-y-3">
              {pending.map((unit) => (
                <li key={unit.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3">
                  <Thumb seed={unit.id} className="h-16 w-24 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {unit.property.name} · {unit.label}
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {unit.bedrooms} bed · {unit.bathrooms} bath · {unit.property.ward}, {unit.property.district}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {unit.property.isVerified ? (
                        <Badge tone="brand">
                          <ShieldCheck />
                          Property verified
                        </Badge>
                      ) : (
                        <Badge tone="warning">Property not verified</Badge>
                      )}
                      <Badge tone="outline">{unit.advanceMonths} months upfront</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="tnum font-semibold">{money(unit.rentAmount)}</p>
                    <p className="text-xs text-foreground-subtle">per month</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Reject
                    </Button>
                    <Button size="sm">Approve & publish</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ── Live listings ───────────────────────────────────────── */}
      <Card className="mt-6 p-0">
        <CardHeader className="p-5">
          <CardTitle>All listings</CardTitle>
          <Badge tone="outline">{units.length} units</Badge>
        </CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Unit</Th>
              <Th>Location</Th>
              <Th className="text-right">Rent</Th>
              <Th className="text-right">Views</Th>
              <Th>Available</Th>
              <Th>Listing</Th>
            </tr>
          </thead>
          <tbody>
            {[...units]
              .sort((a, b) => b.viewCount - a.viewCount)
              .map((unit) => (
                <Tr key={unit.id}>
                  <Td>
                    <p className="font-medium">{unit.label}</p>
                    <p className="text-xs text-foreground-subtle">{unit.property.name}</p>
                  </Td>
                  <Td className="text-sm text-foreground-muted">
                    {unit.property.ward}, {unit.property.district}
                  </Td>
                  <Td className="tnum text-right font-medium">{money(unit.rentAmount)}</Td>
                  <Td className="tnum text-right text-sm text-foreground-muted">
                    {unit.viewCount ? unit.viewCount.toLocaleString() : "—"}
                  </Td>
                  <Td className="text-sm text-foreground-muted">
                    {unit.availableFrom ? date(unit.availableFrom) : "—"}
                  </Td>
                  <Td>
                    <StatusBadge kind="listing" value={unit.listingState} />
                  </Td>
                </Tr>
              ))}
          </tbody>
        </Table>
        {paused.length > 0 && (
          <div className="border-t border-border px-5 py-3 text-xs text-foreground-subtle">
            {paused.length} listing{paused.length > 1 ? "s" : ""} paused — reserved or temporarily withdrawn.
          </div>
        )}
      </Card>
    </>
  );
}
