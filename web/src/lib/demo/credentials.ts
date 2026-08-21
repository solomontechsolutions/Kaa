/**
 * One place for every demo identity, so a reviewer can find them without
 * reading five files, and so the seeds that create these accounts and the
 * sign-in page that advertises them can never drift apart.
 *
 * None of this is how a real account gets made. A tenant proves who they are
 * to NIDA, a landlord and a FieldOps employee are enrolled by Kaa. These
 * constants exist so the *same* real flows can be exercised end to end
 * without an operator having to already know a working NIDA number or phone.
 */

export const DEMO_ORG_ID = "org-demo-landlord";

export const DEMO_TENANT = {
  /** A well-formed but obviously synthetic NIDA number, 20 digits. */
  nida: "19900101000000000012",
  phone: "+255700000101",
  fullName: "Demo Tenant",
  email: "tenant@demo.kaa",
} as const;

export const DEMO_LANDLORD = {
  phone: "+255700000102",
  fullName: "Demo Landlord",
  email: "landlord@demo.kaa",
} as const;

export const DEMO_KAA_OPERATOR = {
  employeeId: "KAA-OP-001",
  fullName: "Demo Kaa Operator",
  email: "operator@demo.kaa",
} as const;

export const DEMO_FIELDOPS_OFFICER = {
  employeeId: "FO-001",
  fullName: "Demo Field Officer",
  email: "fieldofficer@demo.kaa",
} as const;

export const DEMO_FIELDOPS_ADMIN = {
  employeeId: "FO-ADMIN-001",
  fullName: "Demo FieldOps Admin",
  email: "fieldadmin@demo.kaa",
} as const;
