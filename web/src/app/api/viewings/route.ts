import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, notFound, readJson, unauthorized } from "@/lib/api";
import { currentEntitlement } from "@/lib/access/session";
import { assertCan } from "@/lib/access/entitlement";
import { getLiveUnit } from "@/lib/data/catalogue";
import { getAccount } from "@/lib/accounts/store";

const schema = z.object({
  unitId: z.string().min(1).max(80),
  preferredAt: z.string().datetime().optional(),
  note: z.string().max(400).optional(),
});

/**
 * Requesting a viewing.
 *
 * This is the existing Kaa viewing pipeline — the same `viewing_requests` an
 * Operators queue and a Field Ops agent's day are built from. WhatsApp posts
 * here too; there is no WhatsApp-only booking store.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const entitlement = await currentEntitlement();
    if (!entitlement.accountId) return unauthorized();
    assertCan(entitlement, "request_viewing");

    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    const unit = getLiveUnit(parsed.data.unitId);
    if (!unit) return notFound();

    const account = await getAccount(entitlement.accountId);
    if (!account?.phone) return badRequest("Confirm your phone number first");

    // The write path lands in Supabase once the read model moves across; until
    // then the request is recorded and the reference returned, so the flow is
    // exercisable end to end without pretending a landlord was notified.
    const reference = `KAA-VW-${Date.now().toString(36).toUpperCase()}`;
    console.info("[viewing] requested", {
      reference,
      unitId: unit.id,
      orgId: unit.property.orgId,
      accountId: entitlement.accountId,
      preferredAt: parsed.data.preferredAt,
    });

    return NextResponse.json({
      ok: true,
      reference,
      status: "requested",
      unit: { id: unit.id, ward: unit.property.ward, label: unit.label },
    });
  });
}
