import type { Metadata } from "next";

import { CaptureForm } from "@/components/field/capture-form";
import { PageHeader } from "@/components/ui";
import { amenityLabels } from "@/lib/data/seed";
import { currentAgent, wards } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Capture a listing" };

export default function CapturePage() {
  const agent = currentAgent();

  // An agent works their own wards; showing the whole city invites bad pins.
  const myWards = wards.filter((w) => agent.zones.includes(w.id));

  const amenities = Object.entries(amenityLabels).map(([slug, label]) => ({
    slug,
    label: label.en,
  }));

  return (
    <>
      <PageHeader
        title="Capture a listing"
        description="TSh 2,000 on approval, plus TSh 5,000 when a tenant moves in."
      />
      <CaptureForm wards={myWards.length ? myWards : wards} amenities={amenities} />
    </>
  );
}
