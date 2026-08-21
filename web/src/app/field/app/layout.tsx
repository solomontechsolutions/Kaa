import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";

import { FieldAppTabs } from "@/components/fieldops/app-tabs";
import { currentActor } from "@/lib/fieldops/session";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "FieldOps", template: "%s · FieldOps" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#121A1F",
};

/**
 * The handset application.
 *
 * This is the tool an officer holds at a gate: one hand, bright sun, patchy
 * data. It gets its own shell rather than the portal's sidebar — a phone has
 * no room for one, and the two audiences want opposite things. Supervisors
 * want density; an officer wants a large target for their thumb and one
 * obvious next action.
 */
export default async function FieldAppLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect("/field/sign-in");

  // Supervisors and Kaa operators have no business collecting. Sending them to
  // the portal is more useful than refusing them here.
  if (actor.role !== "field_officer") redirect("/field");

  const { locale, t } = await getI18n();

  return (
    <div className="kaa-app flex h-dvh flex-col overflow-hidden bg-background">
      <div className="relative flex-1 overflow-y-auto overscroll-contain">{children}</div>
      <FieldAppTabs
        locale={locale}
        labels={{
          today: t("fieldops.app.today"),
          properties: t("fieldops.app.myProperties"),
          account: t("fieldops.app.account"),
        }}
      />
    </div>
  );
}
