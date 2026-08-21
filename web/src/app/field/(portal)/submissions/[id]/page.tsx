import { ArrowLeft, Camera, Clock, MapPin, RotateCcw, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RelativeTime } from "@/components/fieldops/relative-time";
import { ReviewActions } from "@/components/fieldops/review-actions";
import { StatusPill } from "@/components/fieldops/status";
import { Badge } from "@/components/ui";
import { can } from "@/lib/fieldops/permissions";
import { getSubmissionFor, readiness } from "@/lib/fieldops/service";
import { currentActor, requireActor } from "@/lib/fieldops/session";
import { money } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const actor = await currentActor();
  const submission = actor ? getSubmissionFor(actor, id) : undefined;
  return { title: submission?.reference ?? "Submission" };
}

/**
 * One submission, in full.
 *
 * This is the screen a Kaa operator decides on, so everything the officer
 * collected is here — no expanding, no second page. Beneath it, the complete
 * history: who collected it, who asked for what, and who accepted it. That
 * record is the product FieldOps actually sells Kaa.
 */
export default async function SubmissionDetail(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const actor = await requireActor();
  const submission = getSubmissionFor(actor, id);
  if (!submission) notFound();

  const { locale, t } = await getI18n();
  const check = readiness(submission);
  const property = submission.property;

  const openCorrection = submission.corrections.find((correction) => !correction.resolvedAt);
  const decidable = ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(submission.status);

  return (
    <div className="mx-auto max-w-[76rem] space-y-6">
      <Link
        href="/field/submissions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("fieldops.nav.properties")}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tnum text-2xl font-semibold tracking-tight">{submission.reference}</h1>
            <StatusPill status={submission.status} locale={locale} />
            {submission.submissionCount > 1 && (
              <Badge tone="outline" className="tnum">
                {t("fieldops.submission.attempt", { count: submission.submissionCount })}
              </Badge>
            )}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5" />
              {submission.officerName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <RelativeTime iso={submission.uploadedAt ?? submission.createdAt} />
            </span>
            {property.ward && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {property.ward}
              </span>
            )}
          </p>
        </div>

        {submission.kaaUnitId && (
          <Badge tone="brand" className="tnum">
            {t("fieldops.submission.becameKaaProperty", { id: submission.kaaUnitId })}
          </Badge>
        )}
      </header>

      {openCorrection && (
        <section className="rounded-2xl border border-[#F7CDD2] bg-[#FDECEE] p-5 dark:border-[#5A2027] dark:bg-[#37151A]">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#A61B2B] dark:text-[#FB7185]">
            <RotateCcw className="size-4" />
            {t("fieldops.review.sendBack")}
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-[#A61B2B] dark:text-[#FB7185]">
            {openCorrection.message}
          </p>
          <p className="mt-3 text-xs text-[#A61B2B]/75 dark:text-[#FB7185]/75">
            {openCorrection.raisedByName} · {dateTime(openCorrection.raisedAt)}
          </p>
        </section>
      )}

      {!check.ready && (
        <section className="rounded-2xl border border-[#F5E0B8] bg-[#FDF3E0] p-5 dark:border-[#4A3510] dark:bg-[#33240A]">
          <p className="text-sm font-semibold text-[#8A5A00] dark:text-[#FBBF24]">
            {t("fieldops.submission.stillNeeded")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[#8A5A00] dark:text-[#FBBF24]">
            {check.missing.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Section title={t("fieldops.submission.propertyDetails")}>
            <Facts
              rows={[
                [t("fieldops.field.propertyKind"), property.propertyKind?.replace(/_/g, " ")],
                [t("fieldops.field.houseType"), property.houseType?.replace(/_/g, " ")],
                [t("fieldops.field.bedrooms"), property.bedrooms],
                [t("fieldops.field.bathrooms"), property.bathrooms],
                [t("fieldops.field.monthlyRent"), property.monthlyRent ? money(property.monthlyRent) : undefined],
                [t("fieldops.field.furnishing"), property.furnishing?.replace(/_/g, " ")],
                [t("fieldops.field.condition"), property.condition?.replace(/_/g, " ")],
                [t("fieldops.field.sizeSqm"), property.sizeSqm],
                [t("fieldops.field.availableFrom"), property.availableFrom],
              ]}
            />
          </Section>

          <Section title={t("fieldops.submission.locationDetails")}>
            <Facts
              rows={[
                [t("fieldops.field.region"), property.region],
                [t("fieldops.field.district"), property.district],
                [t("fieldops.field.ward"), property.ward],
                [t("fieldops.field.area"), property.area],
                [t("fieldops.field.street"), property.street],
                [t("fieldops.field.addressLine"), property.addressLine],
                [t("fieldops.field.landmark"), property.landmark],
              ]}
            />

            {property.latitude !== undefined && property.longitude !== undefined && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
                <MapPin className="size-4 shrink-0 text-foreground-subtle" />
                <span className="tnum text-sm">
                  {property.latitude.toFixed(5)}, {property.longitude.toFixed(5)}
                </span>
                {property.gpsAccuracyM !== undefined && (
                  <span
                    className={cn(
                      "tnum text-xs",
                      property.gpsAccuracyM > 50 ? "text-[var(--color-danger)]" : "text-foreground-subtle",
                    )}
                  >
                    {t("fieldops.submission.gpsAccuracy", { metres: Math.round(property.gpsAccuracyM) })}
                  </span>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-sm font-medium text-kaa-700 hover:underline dark:text-kaa-400"
                >
                  {t("fieldops.submission.openInMaps")}
                </a>
              </div>
            )}
          </Section>

          <Section title={t("fieldops.submission.amenitiesUtilities")}>
            {property.amenities.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium capitalize"
                  >
                    {amenity.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground-subtle">—</p>
            )}

            <Facts
              className="mt-4"
              rows={[
                [t("fieldops.field.parkingSpaces"), property.parkingSpaces],
                [t("fieldops.field.water"), property.water?.replace(/_/g, " ")],
                [t("fieldops.field.security"), property.hasSecurity === undefined ? undefined : property.hasSecurity ? "Yes" : "No"],
                [t("fieldops.field.electricity"), property.hasElectricity === undefined ? undefined : property.hasElectricity ? "Yes" : "No"],
                [t("fieldops.field.utilitiesNote"), property.utilitiesNote],
              ]}
            />
          </Section>

          <Section title={t("fieldops.submission.photosSection")}>
            {submission.photos.length === 0 ? (
              <p className="text-sm text-foreground-subtle">{t("fieldops.submission.noPhotos")}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {submission.photos.map((photo) => (
                  <li key={photo.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                    {/* Seeded records carry no image bytes, so the tile names the
                        room rather than pretending a photograph is there. */}
                    {photo.uri.startsWith("data:") || photo.uri.startsWith("blob:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.uri} alt={t(`fieldops.room.${photo.room}`)} className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(0,200,154,0.05)_10px,rgba(0,200,154,0.05)_20px)]">
                        <Camera className="size-5 text-foreground-subtle" />
                      </div>
                    )}
                    <p className="px-3 py-2 text-xs font-medium">{t(`fieldops.room.${photo.room}`)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t("fieldops.submission.landlordDetails")}>
            <Facts
              rows={[
                [t("fieldops.field.landlordName"), property.landlordName],
                [t("fieldops.field.landlordPhone"), property.landlordPhone],
                [t("fieldops.field.caretakerName"), property.caretakerName],
                [t("fieldops.field.caretakerPhone"), property.caretakerPhone],
                [
                  t("fieldops.app.landlordConsentLabel"),
                  property.landlordConsent === undefined ? undefined : property.landlordConsent ? "Yes" : "No",
                ],
              ]}
            />
          </Section>
        </div>

        <aside className="min-w-0 space-y-6">
          {decidable && (
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                {t("fieldops.review.title")}
              </h2>
              <ReviewActions
                submissionId={submission.id}
                locale={locale}
                canReview={can(actor, "approve")}
              />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
              {t("fieldops.submission.historySection")}
            </h2>
            <ol className="space-y-4">
              {[...submission.history].reverse().map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-strong" />
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed">{entry.detail}</p>
                    <p className="tnum mt-0.5 text-xs text-foreground-subtle">
                      {dateTime(entry.at)} · {t(`fieldops.role.${entry.actorRole}`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {submission.corrections.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
                {t("fieldops.submission.correctionsSection")}
              </h2>
              <ol className="space-y-4">
                {submission.corrections.map((correction) => (
                  <li key={correction.id} className="rounded-xl border border-border bg-surface p-3.5">
                    <p className="text-sm leading-relaxed">{correction.message}</p>
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {correction.raisedByName} · {dateTime(correction.raisedAt)}
                      {correction.resolvedAt && " · answered"}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">{title}</h2>
      {children}
    </section>
  );
}

/** Only the fields the officer actually filled. Empty rows are noise. */
function Facts({
  rows,
  className,
}: {
  rows: [string, React.ReactNode | undefined][];
  className?: string;
}) {
  const present = rows.filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!present.length) return <p className="text-sm text-foreground-subtle">—</p>;

  return (
    <dl className={cn("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {present.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-foreground-subtle">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-medium capitalize">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
