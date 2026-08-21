import { OfficerHome } from "@/components/fieldops/officer-home";
import { findSubmissions } from "@/lib/fieldops/service";
import { requireActor } from "@/lib/fieldops/session";
import { listAssignments } from "@/lib/fieldops/store";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Today" };

export default async function FieldAppHome() {
  const actor = await requireActor();
  const locale = await getLocale();

  return (
    <OfficerHome
      locale={locale}
      officerName={actor.name}
      submissions={findSubmissions(actor)}
      assignments={listAssignments(actor.id).map((assignment) => ({
        ward: assignment.ward,
        target: assignment.target,
        collected: assignment.collected,
        dueOn: assignment.dueOn,
      }))}
    />
  );
}
