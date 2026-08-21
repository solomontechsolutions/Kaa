import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, withActor } from "@/lib/fieldops/api";
import { approve, openForReview, readiness, reject, requestCorrection } from "@/lib/fieldops/service";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open") }),
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("send_back"),
    message: z.string().min(10).max(2000),
    fields: z.array(z.string().max(60)).max(30).optional(),
  }),
  z.object({ action: z.literal("reject"), reason: z.string().min(10).max(2000) }),
]);

/**
 * Kaa's side of the loop.
 *
 * Every action here needs the `kaa_operator` role, checked in the service. A
 * field officer calling this endpoint directly with their own submission id
 * gets 403 — approving your own collection is the one thing the whole
 * arrangement exists to prevent.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const parsed = schema.safeParse((await readBody<unknown>(request)) ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", message: "Say what needs correcting — the officer sees this and nothing else." },
        { status: 400 },
      );
    }

    const input = parsed.data;

    if (input.action === "open") {
      const submission = openForReview(actor, id);
      return NextResponse.json({ submission, readiness: readiness(submission) });
    }

    if (input.action === "approve") {
      const { submission, kaaUnitId } = approve(actor, id);
      return NextResponse.json({ submission, kaaUnitId, readiness: readiness(submission) });
    }

    if (input.action === "send_back") {
      const submission = requestCorrection(actor, id, { message: input.message, fields: input.fields });
      return NextResponse.json({ submission, readiness: readiness(submission) });
    }

    const submission = reject(actor, id, input.reason);
    return NextResponse.json({ submission, readiness: readiness(submission) });
  });
}
