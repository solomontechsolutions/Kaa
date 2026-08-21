import { OperatorSignInForm } from "@/components/operators/sign-in-form";
import { DEMO_KAA_OPERATOR } from "@/lib/demo/credentials";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

/**
 * Kaa staff sign in here, on `kaatz.vercel.app` — this is Kaa's own sign-in,
 * against `lib/operators/`, entirely separate from FieldOps' at
 * `kaafieldops.vercel.app/sign-in`. A Kaa operator does not appear on that
 * roster and a FieldOps employee cannot sign in here.
 */
export default async function OperatorSignIn() {
  return <OperatorSignInForm locale={await getLocale()} demoEmployeeId={DEMO_KAA_OPERATOR.employeeId} />;
}
