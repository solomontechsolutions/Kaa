import type { Metadata } from "next";

import { FieldOpsShell } from "@/components/fieldops/shell";
import { requireActor } from "@/lib/fieldops/session";
import { findSubmissions } from "@/lib/fieldops/service";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "FieldOps", template: "%s · FieldOps" },
  robots: { index: false, follow: false },
};

/**
 * The FieldOps operations portal.
 *
 * Two things live under /field and they are not the same product:
 *
 *   /field        the desktop portal — supervisors and Kaa operators at desks
 *   /field/app    the handset application — officers in the field
 *
 * This layout is the portal's. The handset app supplies its own shell, so it
 * opts out below rather than being wrapped in a sidebar it has no room for.
 */
export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  // The pages below call `requireActor` too. A layout's redirect does not stop
  // its page from rendering — they run in parallel — so each page has to
  // establish its own caller rather than trusting this one.
  const actor = await requireActor();

  const locale = await getLocale();
  const all = findSubmissions(actor);

  return (
    <FieldOpsShell
      actor={actor}
      locale={locale}
      badges={{
        review: all.filter((row) => ["UPLOADED", "UNDER_REVIEW", "RESUBMITTED"].includes(row.status)).length,
        corrections: all.filter((row) => row.status === "CORRECTION_REQUIRED").length,
      }}
    >
      {children}
    </FieldOpsShell>
  );
}
