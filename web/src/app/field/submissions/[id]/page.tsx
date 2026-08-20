import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Crosshair,
  ImageIcon,
  MapPin,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { Thumb } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/status";
import { getSubmission } from "@/lib/data/queries";
import { dateTime, displayPhone, money } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/field/submissions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: getSubmission(id)?.propertyName ?? "Submission" };
}

export default async function SubmissionDetailPage(props: PageProps<"/field/submissions/[id]">) {
  const { id } = await props.params;
  const submission = getSubmission(id);
  if (!submission) notFound();

  const accurate = submission.gpsAccuracyM <= 10;
  const isDraft = submission.status === "draft";
  const needsWork = submission.status === "changes_requested";

  return (
    <>
      <Link
        href="/field/submissions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        My listings
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{submission.propertyName}</h1>
          <p className="tnum mt-1 text-sm text-foreground-subtle">{submission.reference}</p>
        </div>
        <StatusBadge kind="submission" value={submission.status} />
      </div>

      {/* ── Reviewer feedback ───────────────────────────────────── */}
      {needsWork && submission.reviewNotes && (
        <Card className="mb-5 border-[var(--color-warning)]/40 bg-[#FDF9F0] dark:bg-[#241C0C]">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]" />
              <div>
                <p className="text-sm font-semibold">Changes requested</p>
                <p className="mt-1 text-sm text-foreground-muted">{submission.reviewNotes}</p>
                {submission.reviewedAt && (
                  <p className="mt-2 text-xs text-foreground-subtle">
                    Reviewed {dateTime(submission.reviewedAt)}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {submission.status === "rejected" && submission.reviewNotes && (
        <Card className="mb-5 border-[var(--color-danger)]/40">
          <CardBody>
            <p className="text-sm font-semibold text-[var(--color-danger)]">Rejected</p>
            <p className="mt-1 text-sm text-foreground-muted">{submission.reviewNotes}</p>
          </CardBody>
        </Card>
      )}

      {/* ── Photos ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <Thumb seed={submission.id} className="h-48 w-full rounded-none" />
        <CardBody className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
            <ImageIcon className="size-4" />
            {submission.photoCount} photos captured
          </span>
          {(isDraft || needsWork) && (
            <Button variant="outline" size="sm">
              <Camera />
              Add photos
            </Button>
          )}
        </CardBody>
      </Card>

      {/* ── Listing detail ──────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Listing</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Units</dt>
              <dd className="tnum font-medium">{submission.unitsCount}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Proposed rent</dt>
              <dd className="tnum font-medium">{money(submission.proposedRent)} / month</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Ward</dt>
              <dd className="font-medium">{submission.ward}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-muted">Captured</dt>
              <dd className="font-medium">{dateTime(submission.capturedAt)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {/* ── Landlord ────────────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Landlord</CardTitle>
        </CardHeader>
        <CardBody className="pt-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface text-foreground-subtle">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{submission.landlordName}</p>
              <a
                href={`tel:${submission.landlordPhone}`}
                className="inline-flex items-center gap-1.5 text-sm text-kaa-700 hover:underline dark:text-kaa-400"
              >
                <Phone className="size-3.5" />
                {displayPhone(submission.landlordPhone)}
              </a>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Location proof ──────────────────────────────────────── */}
      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crosshair className="size-4 text-foreground-subtle" />
            <CardTitle>Location proof</CardTitle>
          </div>
          <Badge tone={accurate ? "success" : "warning"}>±{submission.gpsAccuracyM.toFixed(1)} m</Badge>
        </CardHeader>
        <CardBody className="pt-3">
          <p className="tnum text-sm font-medium">
            <MapPin className="mr-1.5 inline size-4 text-foreground-subtle" />
            {submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
            {accurate
              ? "Accuracy is within tolerance — the pin will land on the right plot."
              : "Accuracy is above 10 m. Re-take the pin standing at the gate, with a clear view of the sky."}
          </p>
        </CardBody>
      </Card>

      {/* ── Actions ─────────────────────────────────────────────── */}
      {(isDraft || needsWork) && (
        <div className="sticky bottom-24 mt-6 flex gap-3">
          <Button variant="outline" className="flex-1">
            Save draft
          </Button>
          <Button className="flex-1">
            <Send />
            {needsWork ? "Resubmit" : "Submit for review"}
          </Button>
        </div>
      )}
    </>
  );
}
