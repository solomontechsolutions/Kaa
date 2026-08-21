/**
 * Kaa's role model, in one place.
 *
 * Five roles, two businesses:
 *
 *   KAA
 *   ├── TENANT           pays the Kaa membership, rents through Kaa
 *   ├── LANDLORD          lists property, pays Kaa nothing
 *   └── KAA_OPERATOR      internal Kaa employee, runs the platform
 *
 *   FIELDOPS               a separate operating entity
 *   ├── FIELDOPS_OFFICER   collects property data in the field
 *   └── FIELDOPS_ADMIN     runs the FieldOps desktop operation
 *
 * A FieldOps employee is never a Kaa operator and never a landlord, even
 * though their work is entirely about Kaa properties — collecting is not
 * reviewing, and the roles stay separate so that distinction cannot blur.
 */

import type { FieldOpsRole } from "@/lib/fieldops/types";

export type Role = "TENANT" | "LANDLORD" | "KAA_OPERATOR" | "FIELDOPS_OFFICER" | "FIELDOPS_ADMIN";

export const ROLES: Role[] = ["TENANT", "LANDLORD", "KAA_OPERATOR", "FIELDOPS_OFFICER", "FIELDOPS_ADMIN"];

/**
 * Where each role lands after sign-in, and the portal a request for another
 * role's area bounces back to. `fieldops_supervisor` is FieldOps' desktop
 * admin role — `FIELDOPS_ADMIN` in the role model the product describes —
 * kept as its existing storage name so nothing that already reads
 * `FieldOpsRole` has to change.
 */
export const ROLE_HOME: Record<Role, string> = {
  TENANT: "/app",
  LANDLORD: "/landlord",
  KAA_OPERATOR: "/operators",
  FIELDOPS_OFFICER: "/field/app",
  FIELDOPS_ADMIN: "/field",
};

/**
 * Where a signed-out visitor for each role starts.
 *
 * `kaatz.vercel.app` (the main deployment) never serves `/field` — see
 * `proxy.ts` — so a Kaa operator, who belongs on *this* domain at
 * `/operators`, gets a sign-in page that lives here too rather than one that
 * 404s by design. FieldOps employees are the opposite case: they are meant
 * to be on the separate FieldOps deployment, where `/field/sign-in` is the
 * real address.
 */
export const ROLE_SIGN_IN: Record<Role, string> = {
  TENANT: "/app/welcome",
  LANDLORD: "/landlord/sign-in",
  KAA_OPERATOR: "/operators/sign-in",
  FIELDOPS_OFFICER: "/field/sign-in",
  FIELDOPS_ADMIN: "/field/sign-in",
};

const FIELDOPS_ROLE_TO_ROLE: Record<FieldOpsRole, Role> = {
  field_officer: "FIELDOPS_OFFICER",
  fieldops_supervisor: "FIELDOPS_ADMIN",
  kaa_operator: "KAA_OPERATOR",
};

export function fromFieldOpsRole(role: FieldOpsRole): Role {
  return FIELDOPS_ROLE_TO_ROLE[role];
}
