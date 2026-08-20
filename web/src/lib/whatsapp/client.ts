/**
 * WhatsApp Business Platform transport.
 *
 * This file knows how to put bytes on the Graph API and nothing else. It has
 * no idea what a property is, whether the tenant has paid, or what should be
 * in a message. That separation is the point: the conversation logic below it
 * is testable without a network, and swapping Meta for another BSP changes
 * only this file.
 */

const GRAPH_VERSION = "v21.0";

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

async function send(payload: Record<string, unknown>): Promise<boolean> {
  if (!whatsappConfigured()) {
    // Development: the composed message is logged so the conversation can be
    // driven end to end without a Meta app.
    console.info("[whatsapp] (not configured) would send", JSON.stringify(payload));
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) {
      console.error("[whatsapp] send failed", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[whatsapp] send threw", error);
    return false;
  }
}

export function sendText(to: string, body: string) {
  return send({ to, type: "text", text: { preview_url: false, body } });
}

/** Up to three buttons — a WhatsApp limit, not ours. */
export function sendButtons(to: string, body: string, buttons: { id: string; title: string }[]) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((button) => ({
          type: "reply",
          // WhatsApp truncates past 20 characters, so do it deliberately.
          reply: { id: button.id, title: button.title.slice(0, 20) },
        })),
      },
    },
  });
}

/** Up to ten rows. Used for property result sets rather than dumping text. */
export function sendList(to: string, body: string, buttonLabel: string, rows: ListRow[]) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [
          {
            title: "Properties",
            rows: rows.slice(0, 10).map((row) => ({
              id: row.id,
              title: row.title.slice(0, 24),
              description: row.description?.slice(0, 72),
            })),
          },
        ],
      },
    },
  });
}

/** A call-to-action URL button, for the unlock link. */
export function sendLink(to: string, body: string, url: string, label: string) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: body },
      action: { name: "cta_url", parameters: { display_text: label.slice(0, 20), url } },
    },
  });
}

export function sendImage(to: string, url: string, caption?: string) {
  return send({ to, type: "image", image: { link: url, caption } });
}

export function markRead(messageId: string) {
  return send({ status: "read", message_id: messageId });
}
