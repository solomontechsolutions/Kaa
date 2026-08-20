import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizePhone } from "@/lib/format";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const schema = z.object({
  phone: z.string().min(9),
  role: z.enum(["tenant", "landlord", "agent", "partner"]).default("tenant"),
  name: z.string().max(120).optional(),
  email: z.email().optional(),
  city: z.string().max(80).optional(),
  message: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Not a valid Tanzanian number" }, { status: 400 });
  }

  const entry = { ...parsed.data, phone, source: "web" };

  if (!isSupabaseConfigured()) {
    // No database yet — acknowledge so the marketing site is still usable.
    console.info("[waitlist] (no Supabase configured)", entry);
    return NextResponse.json({ ok: true, stored: false });
  }

  const supabase = await createClient();
  const { error } = await supabase!.from("waitlist").insert(entry);

  // A repeat signup is a success from the visitor's point of view.
  if (error && error.code !== "23505") {
    console.error("[waitlist] insert failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
