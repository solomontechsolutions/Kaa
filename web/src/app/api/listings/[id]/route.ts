import { NextResponse } from "next/server";

import { guarded, notFound } from "@/lib/api";
import { currentEntitlement } from "@/lib/access/session";
import { isMember } from "@/lib/access/entitlement";
import { viewFor } from "@/lib/access/redact";
import { getLiveUnit } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { isSaved } from "@/lib/accounts/store";
import { similarTo } from "@/lib/search/service";
import { TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

/**
 * One listing.
 *
 * A free caller gets the preview shape: type, ward, bedrooms, a coarse price
 * and an explicit list of what is locked. Deliberately not enough to identify
 * the building and go around Kaa to the landlord — that is the whole point of
 * the preview being thin rather than blurred.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return guarded(async () => {
    const { id } = await context.params;
    const unit = getLiveUnit(id);
    if (!unit) return notFound();

    const entitlement = await currentEntitlement();
    const org = organizations.find((o) => o.id === unit.property.orgId);

    const property = viewFor(
      unit,
      entitlement,
      org ? { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified } : undefined,
    );

    if (!isMember(entitlement)) {
      return NextResponse.json({
        property,
        access: entitlement.level,
        membership: {
          required: true,
          price: { amount: TENANT_ANNUAL_PRICE_TZS, currency: "TZS", period: "year" },
        },
      });
    }

    return NextResponse.json({
      property,
      access: entitlement.level,
      saved: entitlement.accountId ? await isSaved(entitlement.accountId, unit.id) : false,
      similar: similarTo(unit, 4).map((row) => ({
        id: row.unit.id,
        headline: `${row.unit.bedrooms} bedroom`,
        ward: row.unit.property.ward,
        rentAmount: row.unit.rentAmount,
      })),
    });
  });
}
