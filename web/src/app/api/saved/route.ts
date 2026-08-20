import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guarded, notFound, readJson, unauthorized } from "@/lib/api";
import { currentEntitlement } from "@/lib/access/session";
import { assertCan } from "@/lib/access/entitlement";
import { toMemberView } from "@/lib/access/redact";
import { getLiveUnit } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { listSaved, saveProperty, unsaveProperty } from "@/lib/accounts/store";

/**
 * Saved homes are a member benefit, enforced here rather than in the UI.
 *
 * There is deliberately no local-storage fallback anywhere in Kaa for this. A
 * free user who calls this endpoint directly gets 402, the same as a free user
 * who taps the bookmark, and their saves do not exist on any device.
 */
const schema = z.object({ unitId: z.string().min(1).max(80) });

const orgIndex = new Map(organizations.map((org) => [org.id, org]));

export async function GET() {
  return guarded(async () => {
    const entitlement = await currentEntitlement();
    if (!entitlement.accountId) return unauthorized();
    assertCan(entitlement, "save_property");

    const rows = await listSaved(entitlement.accountId);
    const properties = rows
      .map((row) => getLiveUnit(row.unitId))
      .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))
      .map((unit) => {
        const org = orgIndex.get(unit.property.orgId);
        return toMemberView(
          unit,
          org ? { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified } : undefined,
        );
      });

    return NextResponse.json({ saved: properties });
  });
}

export async function POST(request: Request) {
  return guarded(async () => {
    const entitlement = await currentEntitlement();
    if (!entitlement.accountId) return unauthorized();
    assertCan(entitlement, "save_property");

    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();
    if (!getLiveUnit(parsed.data.unitId)) return notFound();

    await saveProperty(entitlement.accountId, parsed.data.unitId);
    return NextResponse.json({ ok: true, saved: true });
  });
}

export async function DELETE(request: Request) {
  return guarded(async () => {
    const entitlement = await currentEntitlement();
    if (!entitlement.accountId) return unauthorized();
    assertCan(entitlement, "save_property");

    const parsed = schema.safeParse(await readJson<unknown>(request));
    if (!parsed.success) return badRequest();

    await unsaveProperty(entitlement.accountId, parsed.data.unitId);
    return NextResponse.json({ ok: true, saved: false });
  });
}
