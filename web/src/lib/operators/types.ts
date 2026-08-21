/**
 * A Kaa operator — an internal Kaa employee. Not FieldOps, not a landlord.
 *
 * This is its own table, deliberately not a row in FieldOps' officer table:
 * the two are separate entities (Kaa fully owned by its founder, FieldOps
 * jointly owned by Kaa and a dalali) and a Kaa operator is on Kaa's payroll,
 * not FieldOps'. Keeping the identity in its own store is what makes it
 * impossible for a Kaa operator to show up on the FieldOps sign-in roster —
 * there is no query that could join the two.
 */
export interface KaaOperator {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  /** `<salt-hex>:<hash-hex>` from `lib/auth/password.ts`. Never the password itself. */
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
}
