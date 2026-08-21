import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, withActor } from "@/lib/fieldops/api";
import { createDraft, findSubmissions, operationsSummary, readiness } from "@/lib/fieldops/service";
import type { SubmissionStatus } from "@/lib/fieldops/types";

const STATUSES = [
  "DRAFT", "READY_FOR_UPLOAD", "UPLOADING", "UPLOADED", "UNDER_REVIEW",
  "CORRECTION_REQUIRED", "RESUBMITTED", "APPROVED", "REJECTED",
] as const;

/**
 * The submission list, filtered by whatever the caller is allowed to see.
 *
 * The filtering is not a convenience: a field officer asking for every
 * submission gets their own back, because `findSubmissions` scopes by role
 * before it applies anything the query string asked for.
 */
export async function GET(request: Request) {
  return withActor(async (actor) => {
    const url = new URL(request.url);
    const status = url.searchParams.getAll("status").filter((value): value is SubmissionStatus =>
      (STATUSES as readonly string[]).includes(value),
    );

    const rows = findSubmissions(actor, {
      status: status.length ? status : undefined,
      officerId: url.searchParams.get("officerId") ?? undefined,
      ward: url.searchParams.get("ward") ?? undefined,
      query: url.searchParams.get("q") ?? undefined,
    });

    return NextResponse.json({
      submissions: rows.map((row) => ({ ...row, readiness: readiness(row) })),
      summary: operationsSummary(actor),
    });
  });
}

const createSchema = z.object({
  ward: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
});

/** Start a record. The officer is whoever is signed in — never a body field. */
export async function POST(request: Request) {
  return withActor(async (actor) => {
    const body = (await readBody<unknown>(request)) ?? {};
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    const submission = createDraft(actor, { ...parsed.data, amenities: [] });
    return NextResponse.json({ submission, readiness: readiness(submission) }, { status: 201 });
  });
}
