import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, withActor } from "@/lib/fieldops/api";
import { captureGps, getSubmissionFor, markReady, readiness, updateDraft } from "@/lib/fieldops/service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const submission = getSubmissionFor(actor, id);
    if (!submission) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ submission, readiness: readiness(submission) });
  });
}

const propertySchema = z.object({
  propertyKind: z.enum(["apartment", "house", "standalone_room", "shared_house", "bedsitter", "commercial"]).optional(),
  houseType: z.enum(["self_contained", "shared_facilities", "master_ensuite", "studio", "duplex", "bungalow"]).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  monthlyRent: z.number().int().min(0).max(100_000_000).optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  availableFrom: z.string().max(40).optional(),
  condition: z.enum(["new", "excellent", "good", "fair", "needs_work"]).optional(),
  sizeSqm: z.number().min(0).max(100_000).optional(),
  region: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  ward: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
  street: z.string().max(160).optional(),
  addressLine: z.string().max(200).optional(),
  landmark: z.string().max(200).optional(),
  amenities: z.array(z.string().max(40)).max(40).optional(),
  parkingSpaces: z.number().int().min(0).max(50).optional(),
  water: z.enum(["piped_reliable", "piped_intermittent", "borehole", "tank_only", "shared_point"]).optional(),
  hasSecurity: z.boolean().optional(),
  hasElectricity: z.boolean().optional(),
  utilitiesNote: z.string().max(400).optional(),
  landlordName: z.string().max(120).optional(),
  landlordPhone: z.string().max(30).optional(),
  caretakerName: z.string().max(120).optional(),
  caretakerPhone: z.string().max(30).optional(),
  landlordConsent: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  property: propertySchema.optional(),
  gps: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracyM: z.number().min(0).max(10_000),
  }).optional(),
  markReady: z.boolean().optional(),
});

/**
 * Edit a draft, record a GPS fix, or declare it finished.
 *
 * All three in one handler because the handset does them together as the
 * officer works — and because `markReady` has to run against whatever the same
 * request just changed, not the state before it.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const parsed = patchSchema.safeParse((await readBody<unknown>(request)) ?? {});
    if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    let submission = getSubmissionFor(actor, id);
    if (!submission) return NextResponse.json({ error: "not_found" }, { status: 404 });

    if (parsed.data.property) submission = updateDraft(actor, id, parsed.data.property);
    if (parsed.data.gps) submission = captureGps(actor, id, parsed.data.gps);
    if (parsed.data.markReady) submission = markReady(actor, id);

    return NextResponse.json({ submission, readiness: readiness(submission!) });
  });
}
