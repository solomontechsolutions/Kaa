import type { Metadata } from "next";
import Link from "next/link";

import { KaaLockup } from "@/components/brand/logo";
import { LandlordSignOutButton } from "@/components/landlord/sign-out-button";
import { Avatar } from "@/components/ui";
import { requireRole } from "@/lib/auth/actor";
import { getLandlord } from "@/lib/landlords/store";

export const metadata: Metadata = {
  title: { default: "Landlord", template: "%s · Kaa Landlord" },
  robots: { index: false, follow: false },
};

/**
 * The landlord portal. Read-only by design: a landlord watches their
 * portfolio, they do not administer Kaa's platform — that is what keeps this
 * a different product from `/operators`, not just a different URL.
 *
 * `requireRole` redirects here too, but the App Router renders a layout and
 * its page in parallel, so a redirect upstairs does not stop the page below
 * it from running for one tick — the page still has to check for itself.
 * `proxy.ts` is the real backend enforcement; this and the page-level checks
 * are the fallback that keeps a signed-out render from ever painting.
 */
export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireRole("LANDLORD");
  const landlord = getLandlord(actor.id)!;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-surface-raised/90 px-4 backdrop-blur-md lg:px-8">
        <Link href="/landlord" className="text-foreground">
          <KaaLockup surface="Landlord" />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 sm:flex">
            <Avatar name={landlord.fullName} className="size-8" />
            <span className="text-sm font-medium">{landlord.fullName}</span>
          </span>
          <LandlordSignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
