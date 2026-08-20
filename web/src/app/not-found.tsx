import Link from "next/link";

import { KaaMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Not found" };

/**
 * The 404. Also what a stray `/field` request on the main deployment lands on:
 * Kaa Field Ops is its own Vercel project at its own domain, so there is
 * genuinely nothing at that path here.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <KaaMark className="size-14 text-kaa-500" gradient id="not-found" />
      <p className="tnum mt-8 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">There is nothing here.</h1>
      <p className="mt-3 max-w-sm text-pretty leading-relaxed text-foreground-muted">
        The page you asked for does not exist on this Kaa deployment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Kaa home</ButtonLink>
        <ButtonLink href="/app" variant="outline">
          Open the app
        </ButtonLink>
      </div>
      <p className="mt-10 text-xs text-foreground-subtle">
        Kaa Field Ops agents:{" "}
        <Link href="/field-ops" className="underline underline-offset-4">
          your portal is at its own address
        </Link>
        .
      </p>
    </div>
  );
}
