import { NextResponse } from "next/server";

import { withActor } from "@/lib/fieldops/api";
import { readiness, upload } from "@/lib/fieldops/service";

/**
 * Send it to Kaa.
 *
 * The same endpoint answers a correction, because from the officer's side it
 * is the same act — the service decides whether that makes it an UPLOAD or a
 * RESUBMIT from the status it is in.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const submission = upload(actor, id);
    return NextResponse.json({ submission, readiness: readiness(submission) });
  });
}
