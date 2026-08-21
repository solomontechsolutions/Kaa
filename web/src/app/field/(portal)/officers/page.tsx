import { redirect } from "next/navigation";

import { RelativeTime } from "@/components/fieldops/relative-time";
import { Badge } from "@/components/ui";
import { can } from "@/lib/fieldops/permissions";
import { findSubmissions } from "@/lib/fieldops/service";
import { requireActor } from "@/lib/fieldops/session";
import { listAssignments, listOfficers } from "@/lib/fieldops/store";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Field officers" };

/**
 * The people doing the collecting.
 *
 * FieldOps employees, not Kaa's tenants or landlords — a different entity's
 * payroll. Supervisors and Kaa operators see this; an officer does not, and is
 * sent back to their own work rather than shown a permission error, because
 * they did not do anything wrong.
 */
export default async function OfficersPage() {
  const actor = await requireActor();
  if (!can(actor, "view_all_fieldops")) redirect("/field/app");

  const { t } = await getI18n();
  const all = findSubmissions(actor);

  const officers = listOfficers()
    .filter((officer) => officer.role === "field_officer")
    .map((officer) => {
      const mine = all.filter((row) => row.officerId === officer.id);
      const approved = mine.filter((row) => row.status === "APPROVED").length;
      const decided = approved + mine.filter((row) => row.status === "REJECTED").length;
      return {
        ...officer,
        collected: mine.length,
        approved,
        approvalRate: decided ? (approved / decided) * 100 : null,
        pending: mine.filter((row) => ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(row.status)).length,
        corrections: mine.filter((row) => row.status === "CORRECTION_REQUIRED").length,
        assignments: listAssignments(officer.id),
      };
    });

  return (
    <div className="mx-auto max-w-[86rem] space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fieldops.officers.title")}</h1>
        <p className="mt-1.5 text-foreground-muted">{t("fieldops.officers.subtitle")}</p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[58rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {[
                t("fieldops.officers.name"),
                t("fieldops.officers.employeeIdColumn"),
                t("fieldops.officers.areas"),
                t("fieldops.officers.collected"),
                t("fieldops.officers.approvedColumn"),
                t("fieldops.officers.pending"),
                t("fieldops.officers.correctionsColumn"),
                t("fieldops.officers.lastActive"),
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {officers.map((officer) => (
              <tr key={officer.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-kaa-50 text-xs font-semibold text-kaa-800 dark:bg-kaa-950 dark:text-kaa-300">
                      {officer.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{officer.fullName}</p>
                      <p className="tnum truncate text-xs text-foreground-subtle">{officer.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="tnum px-4 py-3.5 text-foreground-muted">{officer.employeeId}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {officer.assignedAreas.map((area) => (
                      <span key={area} className="rounded-full bg-surface px-2 py-0.5 text-xs text-foreground-muted">
                        {area}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="tnum px-4 py-3.5 font-medium">{officer.collected}</td>
                <td className="tnum px-4 py-3.5">
                  <span className="font-medium text-kaa-700 dark:text-kaa-400">{officer.approved}</span>
                  {officer.approvalRate !== null && (
                    <span className="ml-1.5 text-xs text-foreground-subtle">
                      {officer.approvalRate.toFixed(0)}%
                    </span>
                  )}
                </td>
                <td className="tnum px-4 py-3.5 text-foreground-muted">{officer.pending}</td>
                <td className="tnum px-4 py-3.5">
                  <span className={cn(officer.corrections > 0 && "font-medium text-[var(--color-danger)]")}>
                    {officer.corrections}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Badge tone={officer.isActive ? "success" : "neutral"}>
                      {officer.isActive ? t("fieldops.officers.active") : t("fieldops.officers.inactive")}
                    </Badge>
                    <span className="whitespace-nowrap text-xs text-foreground-subtle">
                      {officer.lastActiveAt ? <RelativeTime iso={officer.lastActiveAt} /> : t("fieldops.officers.never")}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          {t("fieldops.officers.assignmentsTitle")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {officers.flatMap((officer) =>
            officer.assignments.map((assignment) => {
              const progress = assignment.target ? (assignment.collected / assignment.target) * 100 : 0;
              return (
                <li key={assignment.id} className="rounded-2xl border border-border bg-surface-raised p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{assignment.ward}</p>
                    <span className="tnum text-xs text-foreground-subtle">
                      {t("fieldops.officers.due")} {assignment.dueOn}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-foreground-subtle">{officer.fullName}</p>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className={cn("h-full rounded-full", progress >= 100 ? "bg-kaa-500" : "bg-kaa-400/70")}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <p className="tnum mt-2 text-xs text-foreground-muted">
                    {assignment.collected} / {assignment.target} · {t("fieldops.officers.target")}
                  </p>
                  {assignment.note && (
                    <p className="mt-2 text-xs text-foreground-subtle">{assignment.note}</p>
                  )}
                </li>
              );
            }),
          )}
        </ul>
      </section>
    </div>
  );
}
