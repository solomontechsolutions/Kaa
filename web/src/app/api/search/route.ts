import { NextResponse } from "next/server";
import { z } from "zod";

import { guarded, readJson } from "@/lib/api";
import { currentEntitlement } from "@/lib/access/session";
import { isMember } from "@/lib/access/entitlement";
import { viewsFor } from "@/lib/access/redact";
import { knownPlaces } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import { parseCriteria, type SearchCriteria } from "@/lib/search/criteria";
import { searchProperties } from "@/lib/search/service";
import { TENANT_ANNUAL_PRICE_TZS } from "@/lib/subscription/service";

const schema = z.object({
  /** Natural language. "2 bedroom Mikocheni under 700k with parking". */
  query: z.string().max(500).optional(),
  /** Structured filters from the mobile filter sheet. These win over the text. */
  location: z.string().max(80).optional(),
  bedrooms: z.number().int().min(0).max(12).optional(),
  maxRent: z.number().int().min(0).max(100_000_000).optional(),
  minRent: z.number().int().min(0).max(100_000_000).optional(),
  amenities: z.array(z.string().max(40)).max(20).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

const orgIndex = new Map(
  organizations.map((org) => [org.id, { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified }]),
);

/**
 * Search is free. Access to the houses is not.
 *
 * Everyone — anonymous, free, member — gets a genuine count from the same
 * search over the same catalogue. What differs is the payload: a member gets
 * listings, everyone else gets previews that carry no photo, no address, no
 * landlord and no coordinate.
 *
 * The response is built from `viewsFor`, so there is no path by which a free
 * caller receives a member-shaped object, whatever they put in the request.
 */
export async function POST(request: Request) {
  return guarded(async () => {
    const parsed = schema.safeParse((await readJson<unknown>(request)) ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    const input = parsed.data;
    const places = knownPlaces();

    const fromText: SearchCriteria = input.query ? parseCriteria(input.query, places) : { amenities: [] };

    const criteria: SearchCriteria = {
      ...fromText,
      location: input.location ?? fromText.location,
      bedrooms: input.bedrooms ?? fromText.bedrooms,
      maxRent: input.maxRent ?? fromText.maxRent,
      minRent: input.minRent ?? fromText.minRent,
      amenities: [...new Set([...(input.amenities ?? []), ...fromText.amenities])],
    };

    const entitlement = await currentEntitlement();
    const result = searchProperties(criteria);
    const limit = input.limit ?? 20;

    const units = result.matches.slice(0, limit).map((row) => row.unit);

    return NextResponse.json({
      // The genuine number of available matching homes. Never inflated, and
      // shown to free users precisely because it is the honest signal that
      // Kaa has what they are looking for.
      count: result.count,
      criteria,
      access: entitlement.level,
      results: viewsFor(units, entitlement, orgIndex),
      suggestions: result.suggestions,
      ...(isMember(entitlement)
        ? {}
        : {
            membership: {
              required: true,
              price: { amount: TENANT_ANNUAL_PRICE_TZS, currency: "TZS", period: "year" },
            },
          }),
    });
  });
}
