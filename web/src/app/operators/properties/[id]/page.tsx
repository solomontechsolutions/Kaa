import {
  ArrowLeft,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { amenityLabels } from "@/lib/data/seed";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Progress,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { Stat, Thumb } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { getProperty, listLeases, unitsForProperty } from "@/lib/data/queries";
import { date, displayPhone, money } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/operators/properties/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const property = getProperty(id);
  return { title: property?.name ?? "Property" };
}

export default async function PropertyDetailPage(props: PageProps<"/operators/properties/[id]">) {
  const { id } = await props.params;
  const property = getProperty(id);
  if (!property) notFound();

  const units = unitsForProperty(property.id);
  const leases = listLeases().filter((l) => units.some((u) => u.id === l.unitId));

  const occupied = units.filter((u) => u.status === "occupied");
  const occupancy = units.length ? (occupied.length / units.length) * 100 : 0;
  const rentRoll = occupied.reduce((sum, u) => sum + u.rentAmount, 0);
  const potential = units.reduce((sum, u) => sum + u.rentAmount, 0);

  return (
    <>
      <Link
        href="/operators/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All properties
      </Link>

      {/* ── Header ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <Thumb seed={property.id} className="h-44 w-full rounded-none sm:h-56" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{property.name}</h1>
              {property.isVerified && (
                <Badge tone="brand">
                  <ShieldCheck />
                  Verified {property.verifiedAt && date(property.verifiedAt)}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground-muted">
              <MapPin className="size-4 shrink-0" />
              {property.addressLine} · {property.ward}, {property.district}
            </p>
            {property.landmark && (
              <p className="mt-1 text-sm text-foreground-subtle">{property.landmark}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Edit</Button>
            <ButtonLink href={`/operators/properties/${property.id}/units/new`}>
              <Plus />
              Add unit
            </ButtonLink>
          </div>
        </div>
      </Card>

      {/* ── Numbers ─────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Units" value={units.length} sub={`${occupied.length} occupied`} />
        <Stat label="Occupancy" value={`${occupancy.toFixed(0)}%`} tone="brand" />
        <Stat label="Rent roll" value={money(rentRoll)} sub="contracted monthly" />
        <Stat
          label="Vacancy cost"
          value={money(potential - rentRoll)}
          sub="per month if all let"
          tone={potential - rentRoll > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ── Units ─────────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <Progress value={occupancy} className="mt-2 w-28" />
          </CardHeader>
          <CardBody className="px-0 pb-0 pt-3">
            <Table>
              <thead>
                <tr>
                  <Th>Unit</Th>
                  <Th>Layout</Th>
                  <Th className="text-right">Rent</Th>
                  <Th>Status</Th>
                  <Th>Listing</Th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const lease = leases.find((l) => l.unitId === unit.id && (l.status === "active" || l.status === "ending_soon"));
                  return (
                    <Tr key={unit.id}>
                      <Td>
                        <p className="font-medium">{unit.label}</p>
                        {lease?.tenant && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                            <UserRound className="size-3" />
                            {lease.tenant.fullName}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="inline-flex items-center gap-1">
                            <BedDouble className="size-3.5" />
                            {unit.bedrooms}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bath className="size-3.5" />
                            {unit.bathrooms}
                          </span>
                          {unit.sizeSqm && (
                            <span className="inline-flex items-center gap-1">
                              <Maximize className="size-3.5" />
                              {unit.sizeSqm} m²
                            </span>
                          )}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <span className="tnum font-medium">{money(unit.rentAmount)}</span>
                        <p className="text-xs text-foreground-subtle">
                          {unit.advanceMonths} months upfront
                        </p>
                      </Td>
                      <Td>
                        <StatusBadge kind="unit" value={unit.status} />
                      </Td>
                      <Td>
                        <StatusBadge kind="listing" value={unit.listingState} />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        {/* ── Details ───────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              <p className="text-sm leading-relaxed text-foreground-muted">{property.description}</p>
              <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground-muted">Type</dt>
                  <dd className="font-medium capitalize">{property.type.replace(/_/g, " ")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground-muted">Ward</dt>
                  <dd className="font-medium">{property.ward}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground-muted">Coordinates</dt>
                  <dd className="tnum font-medium">
                    {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-foreground-muted">Added</dt>
                  <dd className="font-medium">{date(property.createdAt)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {property.caretakerName && (
            <Card>
              <CardHeader>
                <CardTitle>Caretaker</CardTitle>
              </CardHeader>
              <CardBody className="pt-3">
                <p className="font-medium">{property.caretakerName}</p>
                <a
                  href={`tel:${property.caretakerPhone}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-kaa-700 hover:underline dark:text-kaa-400"
                >
                  <Phone className="size-3.5" />
                  {displayPhone(property.caretakerPhone!)}
                </a>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              <div className="flex flex-wrap gap-2">
                {[...new Set(units.flatMap((u) => u.amenities))].map((slug) => (
                  <Badge key={slug} tone="outline">
                    {amenityLabels[slug]?.en ?? slug}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
