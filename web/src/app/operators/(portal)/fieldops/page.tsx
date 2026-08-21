import { SubmissionsTable } from "@/components/fieldops/data-table";
import { SubmissionFilters } from "@/components/fieldops/filters";
import { requireActor } from "@/lib/operators/session";
import { findSubmissions } from "@/lib/fieldops/service";
import { listOfficers } from "@/lib/fieldops/store";
import { getI18n } from "@/lib/i18n/server";
import type { SubmissionStatus } from "@/lib/fieldops/types";

export const metadata = { title: "FieldOps submissions" };

const STATUSES: SubmissionStatus[] = [
  "UPLOADED", "UNDER_REVIEW", "CORRECTION_REQUIRED", "RESUBMITTED", "APPROVED", "REJECTED",
];

/**
 * FieldOps submissions, reviewed from inside Kaa's own admin.
 *
 * This is the one place a Kaa operator approves or sends back a FieldOps
 * submission — not FieldOps' own portal, which a Kaa operator does not have
 * access to (see `proxy.ts`). The data and the actions are exactly the ones
 * FieldOps' `/field/submissions` uses; only the actor resolving them and the
 * URL they live at are different, which is what keeps this from being a
 * second, competing approval surface.
 */
export default async function OperatorsFieldOpsPage(props: {
  searchParams: Promise<{ status?: string | string[]; officerId?: string; ward?: string; q?: string }>;
}) {
  const actor = await requireActor();
  const { locale, t } = await getI18n();
  const params = await props.searchParams;

  const requested = (Array.isArray(params.status) ? params.status : params.status ? [params.status] : [])
    .filter((value): value is SubmissionStatus => STATUSES.includes(value as SubmissionStatus));

  const rows = findSubmissions(actor, {
    status: requested.length ? requested : undefined,
    officerId: params.officerId,
    ward: params.ward,
    query: params.q,
  });

  const total = findSubmissions(actor).length;
  const wards = [...new Set(findSubmissions(actor).map((row) => row.property.ward).filter(Boolean))] as string[];

  const officers = listOfficers()
    .filter((officer) => officer.role === "field_officer")
    .map((officer) => ({ id: officer.id, name: officer.fullName }));

  const filtered = requested.length || params.officerId || params.ward || params.q;

  return (
    <div className="mx-auto max-w-[86rem] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FieldOps submissions</h1>
          <p className="tnum mt-1.5 text-sm text-foreground-muted">
            {t("fieldops.table.rowsShown", { shown: rows.length, total })}
          </p>
        </div>
      </header>

      <SubmissionFilters
        basePath="/operators/fieldops"
        statuses={STATUSES}
        wards={wards.sort()}
        officers={officers}
        selected={{ status: requested, officerId: params.officerId, ward: params.ward, q: params.q }}
        labels={{
          status: t("fieldops.filter.status"),
          officer: t("fieldops.filter.officer"),
          ward: t("fieldops.filter.ward"),
          anyOfficer: t("fieldops.filter.anyOfficer"),
          anyWard: t("fieldops.filter.anyWard"),
          clear: t("fieldops.filter.clear"),
          search: t("fieldops.searchPlaceholder"),
        }}
        statusLabels={Object.fromEntries(STATUSES.map((status) => [status, t(`fieldops.status.${status}`)]))}
      />

      <SubmissionsTable
        basePath="/operators/fieldops"
        submissions={rows}
        locale={locale}
        labels={{
          reference: t("fieldops.table.reference"),
          officer: t("fieldops.table.officer"),
          location: t("fieldops.table.location"),
          property: t("fieldops.table.property"),
          rent: t("fieldops.table.rent"),
          status: t("fieldops.table.status"),
          updated: t("fieldops.table.updated"),
        }}
        emptyTitle={filtered ? t("fieldops.table.noMatch") : t("fieldops.table.empty")}
        emptyBody={filtered ? t("fieldops.table.noMatchBody") : t("fieldops.table.emptyBody")}
      />
    </div>
  );
}
