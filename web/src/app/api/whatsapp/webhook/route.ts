import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { handleMessage, type InboundMessage, type Outbound } from "@/lib/whatsapp/handler";
import { markRead, sendButtons, sendImage, sendLink, sendList, sendText } from "@/lib/whatsapp/client";

/**
 * The WhatsApp Business Platform webhook.
 *
 * Transport only. It verifies Meta's signature, unwraps the envelope, hands
 * the message to the conversation manager, and puts the replies back on the
 * wire. It contains no property logic and no access decisions — those belong
 * to the shared services, which is what stops WhatsApp drifting into a second
 * Kaa with its own rules.
 */

/** Meta's one-time subscription handshake. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    console.error("[whatsapp] WHATSAPP_VERIFY_TOKEN is not set");
    return new NextResponse("Not configured", { status: 500 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Meta signs every delivery with the app secret. Without this check the
 * endpoint is a way for anyone to impersonate any tenant's number — which,
 * since a linked number identifies a Kaa account, would be a way past the
 * paywall as well as a privacy breach.
 */
function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.error("[whatsapp] WHATSAPP_APP_SECRET is not set, refusing delivery");
    return false;
  }
  if (!header?.startsWith("sha256=")) return false;

  const provided = Buffer.from(header.slice(7), "hex");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

interface Envelope {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          id: string;
          from: string;
          type: string;
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }[];
      };
    }[];
  }[];
}

function unwrap(envelope: Envelope): { messageId: string; message: InboundMessage }[] {
  const out: { messageId: string; message: InboundMessage }[] = [];

  for (const entry of envelope.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const reply = message.interactive?.button_reply ?? message.interactive?.list_reply;
        const text = message.text?.body ?? reply?.title ?? "";
        if (!text && !reply) continue;

        out.push({
          messageId: message.id,
          message: { from: message.from, text, replyId: reply?.id },
        });
      }
    }
  }

  return out;
}

async function deliver(to: string, outbound: Outbound) {
  switch (outbound.kind) {
    case "text":
      return sendText(to, outbound.body);
    case "buttons":
      return sendButtons(to, outbound.body, outbound.buttons);
    case "list":
      return sendList(to, outbound.body, outbound.buttonLabel, outbound.rows);
    case "link":
      return sendLink(to, outbound.body, outbound.url, outbound.label);
    case "image":
      return sendImage(to, outbound.url, outbound.caption);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let envelope: Envelope;
  try {
    envelope = JSON.parse(rawBody) as Envelope;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Meta retries anything that is not acknowledged quickly, and a retry would
  // replay the tenant's message. Acknowledge first, then work.
  const inbound = unwrap(envelope);

  for (const { messageId, message } of inbound) {
    try {
      await markRead(messageId);
      const { messages } = await handleMessage(message);
      for (const outbound of messages) {
        await deliver(message.from, outbound);
      }
    } catch (error) {
      console.error("[whatsapp] turn failed", error);
      // Never leave a tenant with silence.
      await sendText(message.from, "Samahani, kuna hitilafu. Tafadhali jaribu tena.");
    }
  }

  return NextResponse.json({ ok: true, handled: inbound.length });
}
