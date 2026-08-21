/**
 * Route-handler plumbing for FieldOps.
 *
 * The workflow throws typed errors — `ForbiddenError` when a role may not do
 * something, `WorkflowError` when the submission is in the wrong state — and
 * this turns them into responses. A refused transition answers 409 with the
 * reason in plain words, because that reason is shown to a field officer
 * standing at a gate and has to be actionable.
 */

import { NextResponse } from "next/server";

import { ForbiddenError } from "./permissions";
import { WorkflowError } from "./service";
import { currentActor } from "./session";
import type { Actor } from "./permissions";

export async function withActor(
  run: (actor: Actor) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  try {
    const actor = await currentActor();
    if (!actor) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
    return await run(actor);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden", message: error.message }, { status: 403 });
    }
    if (error instanceof WorkflowError) {
      return NextResponse.json({ error: "workflow", message: error.message }, { status: 409 });
    }
    console.error("[fieldops] unhandled", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function readBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
