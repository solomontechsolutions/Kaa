import { OfficerProperties } from "@/components/fieldops/officer-properties";
import { findSubmissions } from "@/lib/fieldops/service";
import { requireActor } from "@/lib/fieldops/session";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "My properties" };

export default async function OfficerPropertiesPage() {
  const actor = await requireActor();
  return <OfficerProperties locale={await getLocale()} submissions={findSubmissions(actor)} />;
}
