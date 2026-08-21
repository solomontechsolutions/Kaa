import { SignInForm } from "@/components/fieldops/sign-in-form";
import { getLocale } from "@/lib/i18n/server";
import { listOfficers } from "@/lib/fieldops/store";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function FieldOpsSignIn() {
  // The demo roster — employee IDs only, so a reviewer can fill the field
  // without retyping it. Passwords are never listed here; the boundary that
  // actually checks one is `/api/fieldops/session`. There is no Kaa operator
  // on this list: `listOfficers()` only ever returns FieldOps' own employees
  // (see `lib/fieldops/types.ts`, `FieldOpsEmployeeRole`).
  const roster = listOfficers()
    .filter((officer) => officer.isActive)
    .map((officer) => ({
      employeeId: officer.employeeId,
      fullName: officer.fullName,
      role: officer.role,
    }));

  return <SignInForm locale={await getLocale()} roster={roster} />;
}
