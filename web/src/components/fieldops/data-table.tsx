import Link from "next/link";

import { RelativeTime } from "@/components/fieldops/relative-time";
import { StatusPill } from "@/components/fieldops/status";
import type { Locale } from "@/lib/i18n/config";
import type { PropertySubmission } from "@/lib/fieldops/types";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The submissions table.
 *
 * A table, on purpose: a supervisor scanning forty records needs to compare
 * rows down a column, which cards make impossible. It scrolls horizontally
 * inside its own container rather than pushing the page sideways, and below
 * `md` it becomes a stack, because a five-column table on a phone is unusable
 * however carefully it is styled.
 */
export function SubmissionsTable({
  submissions,
  locale,
  labels,
  emptyTitle,
  emptyBody,
  compact = false,
  basePath = "/field/submissions",
}: {
  submissions: PropertySubmission[];
  locale: Locale;
  /** Drops the columns that do not fit when the table shares a row. */
  compact?: boolean;
  /** Where a row links to. FieldOps' own portal and Kaa Operators' review queue point at different trees. */
  basePath?: string;
  labels: {
    reference: string;
    officer: string;
    location: string;
    property: string;
    rent: string;
    status: string;
    updated: string;
  };
  emptyTitle: string;
  emptyBody: string;
}) {
  if (!submissions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-raised px-6 py-16 text-center">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-foreground-muted">{emptyBody}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface-raised md:block">
        <table className={cn("w-full border-collapse text-sm", compact ? "min-w-[34rem]" : "min-w-[52rem]")}>
          <thead>
            <tr className="border-b border-border text-left">
              <Th>{labels.reference}</Th>
              <Th>{labels.officer}</Th>
              <Th>{labels.location}</Th>
              {!compact && <Th>{labels.property}</Th>}
              <Th className="text-right">{labels.rent}</Th>
              <Th>{labels.status}</Th>
              {!compact && <Th className="text-right">{labels.updated}</Th>}
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr
                key={submission.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-surface"
              >
                <Td>
                  <Link
                    href={`${basePath}/${submission.id}`}
                    className="tnum font-medium text-kaa-700 hover:underline dark:text-kaa-400"
                  >
                    {submission.reference}
                  </Link>
                  {submission.submissionCount > 1 && (
                    <span className="tnum ml-2 rounded bg-surface px-1.5 py-0.5 text-[0.7rem] text-foreground-subtle">
                      ×{submission.submissionCount}
                    </span>
                  )}
                </Td>
                <Td className="text-foreground-muted">{submission.officerName}</Td>
                <Td>
                  <span className="block truncate">{submission.property.ward ?? "—"}</span>
                  <span className="block truncate text-xs text-foreground-subtle">
                    {submission.property.area ?? submission.property.district ?? ""}
                  </span>
                </Td>
                {!compact && (
                  <Td className="text-foreground-muted">
                    {submission.property.bedrooms ?? "—"} bed · {submission.property.bathrooms ?? "—"} bath
                  </Td>
                )}
                <Td className="tnum text-right font-medium">
                  {submission.property.monthlyRent ? money(submission.property.monthlyRent) : "—"}
                </Td>
                <Td>
                  <StatusPill status={submission.status} locale={locale} compact />
                </Td>
                {!compact && (
                  <Td className="text-right text-xs text-foreground-subtle">
                    <RelativeTime iso={submission.updatedAt} />
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2.5 md:hidden">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <Link
              href={`/field/submissions/${submission.id}`}
              className="block rounded-2xl border border-border bg-surface-raised p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="tnum font-medium text-kaa-700 dark:text-kaa-400">{submission.reference}</span>
                <StatusPill status={submission.status} locale={locale} compact />
              </div>
              <p className="mt-2 text-sm">
                {submission.property.ward ?? "—"} · {submission.property.bedrooms ?? "—"} bed
              </p>
              <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-subtle">
                <span>{submission.officerName}</span>
                <span className="tnum">
                  {submission.property.monthlyRent ? money(submission.property.monthlyRent) : "—"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("max-w-[14rem] px-4 py-3.5 align-middle", className)}>{children}</td>;
}

