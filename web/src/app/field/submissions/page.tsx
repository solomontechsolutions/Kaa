import { Camera, ChevronRight, ImageIcon, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink, Card, CardBody, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/ui/status";
import { Thumb } from "@/components/ui/stat";
import { CURRENT_AGENT_ID } from "@/lib/data/seed";
import { listSubmissions } from "@/lib/data/queries";
import { money, relative } from "@/lib/format";
import type { SubmissionStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My listings" };

/** Open work first, then history, an agent cares about what is unfinished. */
const ORDER: SubmissionStatus[] = ["changes_requested", "draft", "in_review", "submitted", "approved", "rejected"];

export default function SubmissionsPage() {
  const submissions = [...listSubmissions(CURRENT_AGENT_ID)].sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status),
  );

  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="My listings"
        description={`${submissions.length} submissions all time`}
        action={
          <ButtonLink href="/field/capture" size="sm">
            <Camera />
            New
          </ButtonLink>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {ORDER.filter((s) => counts[s]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <StatusBadge kind="submission" value={status} />
            <span className="tnum text-xs text-foreground-subtle">{counts[status]}</span>
          </span>
        ))}
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={<Camera />}
          title="No listings yet"
          description="Capture your first property to start earning."
          action={<ButtonLink href="/field/capture">Capture a listing</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link href={`/field/submissions/${s.id}`}>
                <Card interactive className="p-0">
                  <CardBody className="flex items-center gap-3.5 p-3.5">
                    <Thumb seed={s.id} className="h-16 w-20 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium">{s.propertyName}</p>
                        <StatusBadge kind="submission" value={s.status} />
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-subtle">
                        <MapPin className="size-3 shrink-0" />
                        {s.ward}
                        <span className="mx-1">·</span>
                        <ImageIcon className="size-3 shrink-0" />
                        {s.photoCount}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="tnum text-sm font-medium">
                          {money(s.proposedRent)}
                          <span className="text-xs font-normal text-foreground-subtle"> /month</span>
                        </span>
                        <span className="text-xs text-foreground-subtle">
                          {s.submittedAt ? relative(s.submittedAt) : relative(s.capturedAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-foreground-subtle" />
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
