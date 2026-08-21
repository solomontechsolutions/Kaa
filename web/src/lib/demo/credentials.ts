/**
 * One place for every demo identity, so a reviewer can find them without
 * reading five files, and so the seeds that create these accounts and the
 * sign-in pages that advertise them can never drift apart.
 *
 * None of this is how a real account gets made. A tenant proves who they are
 * to NIDA, a landlord and a FieldOps employee are enrolled by Kaa. These
 * constants exist so the *same* real flows can be exercised end to end
 * without a reviewer already having a working NIDA number or phone.
 *
 * DEMO ONLY — NOT PRODUCTION CREDENTIALS. Passwords are hashed with
 * `lib/auth/password.ts` before they ever touch a store; this file holds the
 * plaintext only because the seeds need it once, at startup, to compute that
 * hash. Nothing here is ever sent to a client — see each role's session
 * route, none of which echoes a password or hash back.
 */

export const DEMO_ORG_ID = "org-demo-landlord";

export const DEMO_TENANT = {
  /** A well-formed but obviously synthetic NIDA number, 20 digits. Development-mode only. */
  nida: "19900101000000000001",
  phone: "+255700000101",
  fullName: "Demo Tenant",
  email: "tenant@demo.kaa",
  /** Reference only — the tenant flow is NIDA + phone OTP, not a password. */
  password: "KaaDemo@2026",
} as const;

export const DEMO_LANDLORD = {
  phone: "+255700000102",
  fullName: "Demo Landlord",
  email: "landlord@demo.kaa",
  /** Works alongside the phone + OTP flow, not instead of it. */
  password: "KaaDemo@2026",
} as const;

export const DEMO_KAA_OPERATOR = {
  employeeId: "KAA-OP-001",
  fullName: "Demo Kaa Operator",
  email: "operator@demo.kaa",
  password: "KaaOperator@2026",
} as const;

export const DEMO_FIELDOPS_OFFICER = {
  employeeId: "FO-001",
  fullName: "Demo Field Officer",
  email: "fieldofficer@demo.kaa",
  password: "FieldOps@2026",
} as const;

export const DEMO_FIELDOPS_ADMIN = {
  employeeId: "FO-ADMIN-001",
  fullName: "Demo FieldOps Admin",
  email: "fieldadmin@demo.kaa",
  password: "FieldOpsAdmin@2026",
} as const;
