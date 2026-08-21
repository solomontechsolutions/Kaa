import { CollectForm } from "@/components/fieldops/collect-form";
import { getSubmissionFor } from "@/lib/fieldops/service";
import { requireActor } from "@/lib/fieldops/session";
import { wards } from "@/lib/data/catalogue";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Collect" };

/**
 * Collecting, or correcting.
 *
 * `new` starts a fresh record on the device. A local id resumes a draft that
 * never left. A server id is a submission Kaa sent back — that one is seeded
 * from the server so the officer edits what the reviewer actually saw.
 */
export default async function CollectPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const actor = await requireActor();

  const serverSubmission = id === "new" ? undefined : getSubmissionFor(actor, id);

  return (
    <CollectForm
      locale={await getLocale()}
      draftId={id}
      serverSubmission={serverSubmission}
      wards={wards.map((ward) => ward.name)}
    />
  );
}
