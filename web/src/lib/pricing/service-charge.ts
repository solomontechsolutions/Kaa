/**
 * Kaa's rental service charge — the entire commercial model in one file.
 *
 * Kaa charges landlords nothing. Kaa's revenue on the rental side is a
 * recurring percentage of rent, charged to the tenant, on top of the
 * landlord's rent — never folded into it. The landlord's rent and Kaa's
 * charge are computed and stored separately everywhere: here, in the
 * database, and in every UI that shows a rental figure.
 *
 * `KAA_RENTAL_SERVICE_RATE` is the one place the 10% lives. A future change
 * to the rate is a one-line edit here, not a search across the codebase.
 */

/** The landlord pays Kaa nothing. This is not a placeholder — it is the model. */
export const LANDLORD_KAA_CHARGE_TZS = 0;

/** Kaa's recurring rental service charge, as a fraction of the landlord's rent. */
export const KAA_RENTAL_SERVICE_RATE = 0.1;

export interface RentBreakdown {
  /** The landlord's actual rent. What the landlord agreed to charge, unchanged by Kaa. */
  baseRent: number;
  /** The rate applied, so a UI can show "10%" without hard-coding it. */
  kaaServiceRate: number;
  /** `round(baseRent * kaaServiceRate)`. Recomputed, never stored as a flat figure. */
  kaaServiceCharge: number;
  /** What the tenant pays each period: rent plus Kaa's charge. */
  tenantTotal: number;
}

/**
 * Kaa's monthly charge for one rental, given the landlord's current rent.
 * Whole shillings — mobile money does not move fractional TZS.
 */
export function kaaServiceCharge(baseRent: number, rate: number = KAA_RENTAL_SERVICE_RATE): number {
  return Math.round(baseRent * rate);
}

/**
 * The full breakdown a tenant or landlord screen renders from. Always derived
 * from `baseRent` at read time, so a rent change on the landlord's side is
 * reflected the next time this is called — nothing to migrate, nothing to
 * recompute in a batch job.
 */
export function rentBreakdown(baseRent: number, rate: number = KAA_RENTAL_SERVICE_RATE): RentBreakdown {
  const charge = kaaServiceCharge(baseRent, rate);
  return {
    baseRent,
    kaaServiceRate: rate,
    kaaServiceCharge: charge,
    tenantTotal: baseRent + charge,
  };
}
