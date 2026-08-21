import { SignInForm } from "@/components/fieldops/sign-in-form";
import { getLocale } from "@/lib/i18n/server";
import { listOfficers } from "@/lib/fieldops/store";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

/**
 * Kaa staff sign in here, on `kaatz.vercel.app` — not at `/field/sign-in`,
 * which lives on the separate FieldOps deployment and is not served on this
 * domain (see `proxy.ts`). Same identity, same API route
 * (`/api/fieldops/session`, which is not surface-restricted), just the
 * address a Kaa operator actually reaches from this site. Only Kaa operators
 * are offered as demo accounts here — a field officer or FieldOps admin
 * signing in on this domain has nowhere to go, since their portals are not
 * served here.
 */
export default async function OperatorSignIn() {
  const roster = listOfficers()
    .filter((officer) => officer.isActive && officer.role === "kaa_operator")
    .map((officer) => ({
      employeeId: officer.employeeId,
      fullName: officer.fullName,
      role: officer.role,
    }));

  return <SignInForm locale={await getLocale()} roster={roster} brand="operators" />;
}
