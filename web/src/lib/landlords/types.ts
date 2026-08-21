/**
 * A Kaa landlord — a partner who lists property on Kaa, not a Kaa employee.
 *
 * Landlords do not sign up on the website: FieldOps enrols them when an
 * officer visits and collects a property, the same way `landlordName` and
 * `landlordPhone` are captured on a submission today. This record is what
 * that enrolment becomes once Kaa has a person to let sign in and watch
 * their portfolio — a phone number and the org their properties live under.
 *
 * A landlord holds no membership and pays Kaa nothing. There is no
 * subscription row for a landlord and there never should be one.
 */
export interface Landlord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  /** `<salt-hex>:<hash-hex>` from `lib/auth/password.ts`. Optional: a landlord enrolled without an email has none, and signs in by phone + OTP only. */
  passwordHash?: string;
  /** The organisation whose properties this landlord may see. */
  orgId: string;
  isActive: boolean;
  createdAt: string;
}
