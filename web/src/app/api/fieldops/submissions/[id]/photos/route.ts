import { NextResponse } from "next/server";
import { z } from "zod";

import { readBody, withActor } from "@/lib/fieldops/api";
import { addPhoto, readiness, removePhoto } from "@/lib/fieldops/service";

const addSchema = z.object({
  room: z.enum(["exterior", "living_room", "bedroom", "kitchen", "bathroom", "compound", "other"]),
  /** A data URL from the device camera, or a storage path once uploaded. */
  uri: z.string().min(1).max(8_000_000),
  size: z.number().int().min(0).optional(),
  caption: z.string().max(200).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const parsed = addSchema.safeParse((await readBody<unknown>(request)) ?? {});
    if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    const submission = addPhoto(actor, id, { ...parsed.data, capturedAt: new Date().toISOString() });
    return NextResponse.json({ submission, readiness: readiness(submission) });
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return withActor(async (actor) => {
    const { id } = await context.params;
    const body = await readBody<{ photoId?: string }>(request);
    if (!body?.photoId) return NextResponse.json({ error: "bad_request" }, { status: 400 });

    const submission = removePhoto(actor, id, body.photoId);
    return NextResponse.json({ submission, readiness: readiness(submission) });
  });
}
