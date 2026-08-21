import { SignInForm } from "@/components/fieldops/sign-in-form";
import { getLocale } from "@/lib/i18n/server";
import { listOfficers } from "@/lib/fieldops/store";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function FieldOpsSignIn() {
  // The demo roster, so a reviewer can get in without a seeded password. On a
  // real deployment this list comes from the officer table and the form asks
  // for a credential; the boundary is `/api/fieldops/session`.
  const roster = listOfficers()
    .filter((officer) => officer.isActive)
    .map((officer) => ({
      employeeId: officer.employeeId,
      fullName: officer.fullName,
      role: officer.role,
    }));

  return <SignInForm locale={await getLocale()} roster={roster} />;
}
