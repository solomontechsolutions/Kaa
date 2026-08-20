import { beforeEach, describe, expect, it } from "vitest";

import { createAccount, __resetStore, listSaved } from "@/lib/accounts/store";
import { __resetConversations, getConversation } from "@/lib/whatsapp/conversation";
import { handleMessage, type Outbound } from "@/lib/whatsapp/handler";
import { listLiveUnits } from "@/lib/data/catalogue";
import { confirmPayment, startCheckout } from "@/lib/subscription/service";
import { searchProperties } from "@/lib/search/service";

const PHONE = "+255784000500";

function textOf(messages: Outbound[]): string {
  return messages
    .map((message) =>
      message.kind === "image" ? (message.caption ?? "") : "body" in message ? message.body : "",
    )
    .join("\n");
}

async function freeTenant() {
  return createAccount({
    nidaStatus: "verified",
    nidaVerifiedAt: new Date().toISOString(),
    phone: PHONE,
    whatsappPhone: PHONE,
    phoneVerifiedAt: new Date().toISOString(),
    preferredLanguage: "en",
  });
}

async function paidTenant() {
  const account = await freeTenant();
  const checkout = await startCheckout({ accountId: account.id, phone: PHONE });
  await confirmPayment(checkout.paymentReference, "PROVIDER-1");
  return account;
}

beforeEach(() => {
  __resetStore();
  __resetConversations();
});

describe("a new conversation", () => {
  it("greets rather than interrogating", async () => {
    const { messages } = await handleMessage({ from: PHONE, text: "Hi" });
    expect(textOf(messages)).toContain("Welcome to Kaa");
  });

  it("answers Swahili in Swahili when the number is not yet linked", async () => {
    const { messages } = await handleMessage({ from: "+255700111222", text: "Habari" });
    expect(textOf(messages)).toContain("Karibu Kaa");
  });

  it("asks one question at a time, not a form", async () => {
    const { messages } = await handleMessage({ from: PHONE, text: "I'm looking for a house" });
    const body = textOf(messages);
    const questions = (body.match(/\?/g) ?? []).length;
    expect(questions).toBeLessThanOrEqual(1);
  });
});

describe("a free user", () => {
  it("gets the genuine count from the same search the app uses", async () => {
    await freeTenant();
    const { messages } = await handleMessage({
      from: PHONE,
      text: "I need a 2 bedroom in Mikocheni under 700k with parking",
    });

    const expected = searchProperties({
      bedrooms: 2,
      location: "Mikocheni",
      maxRent: 700_000,
      amenities: ["parking"],
    }).count;

    if (expected > 0) {
      expect(textOf(messages)).toContain(String(expected));
    } else {
      expect(textOf(messages)).toContain("couldn't find");
    }
  });

  it("is offered the unlock, at TZS 10,000", async () => {
    await freeTenant();
    const { messages } = await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });
    const body = textOf(messages);

    expect(body).toContain("10,000");
    expect(messages.some((message) => message.kind === "link")).toBe(true);
  });

  it("never receives a property name, address, rent or landlord — WhatsApp is not a loophole", async () => {
    await freeTenant();
    const statedBudget = 700_000;
    const { messages } = await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });
    const body = textOf(messages);

    for (const unit of listLiveUnits()) {
      expect(body).not.toContain(unit.property.name);
      expect(body).not.toContain(unit.property.addressLine);
      expect(body).not.toContain(unit.property.landmark ?? "\u0000never");
      if (unit.property.caretakerPhone) expect(body).not.toContain(unit.property.caretakerPhone);

      // The tenant's own ceiling is echoed back to them, which is not a leak.
      // Any other rent appearing would be.
      if (unit.rentAmount !== statedBudget) {
        expect(body).not.toContain(unit.rentAmount.toLocaleString("en-US"));
      }
    }
  });

  it("never receives a photo", async () => {
    await freeTenant();
    const { messages } = await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });
    expect(messages.some((message) => message.kind === "image")).toBe(false);
  });

  it("cannot open a listing by asking for it by number", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });

    const { messages } = await handleMessage({ from: PHONE, text: "number 2" });
    const body = textOf(messages);
    expect(body).toContain("10,000");
    for (const unit of listLiveUnits()) expect(body).not.toContain(unit.property.name);
  });

  it("cannot open a listing by forging the interactive reply id", async () => {
    await freeTenant();
    const target = listLiveUnits()[0]!;

    const { messages } = await handleMessage({
      from: PHONE,
      text: "show me this",
      replyId: `unit:${target.id}`,
    });

    expect(textOf(messages)).not.toContain(target.property.name);
    expect(messages.some((message) => message.kind === "image")).toBe(false);
  });

  it("cannot save a property", async () => {
    const account = await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });
    await handleMessage({ from: PHONE, text: "save" });

    expect(await listSaved(account.id)).toHaveLength(0);
  });

  it("cannot unlock by claiming to have paid", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });

    const { messages } = await handleMessage({ from: PHONE, text: "Done, I have paid" });
    const body = textOf(messages);

    expect(body).not.toContain("You're now a Kaa member");
    expect(body).toContain("10,000");
  });
});

describe("a paying member", () => {
  it("gets real properties", async () => {
    await paidTenant();
    const { messages, conversation } = await handleMessage({
      from: PHONE,
      text: "2 bedroom under 900k",
    });

    expect(conversation.state).toBe("SHOWING_RESULTS");
    expect(messages.some((message) => message.kind === "list")).toBe(true);
    expect(textOf(messages)).not.toContain("10,000");
  });

  it("opens one by number, with the details the database holds", async () => {
    const account = await paidTenant();
    void account;

    const first = await handleMessage({ from: PHONE, text: "2 bedroom under 900k" });
    if (!first.conversation.lastResults.length) return;

    const { messages, conversation } = await handleMessage({ from: PHONE, text: "number 1" });
    const shown = listLiveUnits().find((unit) => unit.id === conversation.focusedUnitId)!;

    expect(conversation.state).toBe("VIEWING_PROPERTY");
    expect(textOf(messages)).toContain(shown.property.ward);
    expect(textOf(messages)).toContain(shown.rentAmount.toLocaleString("en-US"));
  });

  it("saves to the same list the app reads", async () => {
    const account = await paidTenant();
    const first = await handleMessage({ from: PHONE, text: "2 bedroom under 900k" });
    if (!first.conversation.lastResults.length) return;

    await handleMessage({ from: PHONE, text: "number 1" });
    await handleMessage({ from: PHONE, text: "save" });

    const saved = await listSaved(account.id);
    expect(saved).toHaveLength(1);
    expect(saved[0]!.unitId).toBe(getConversation(PHONE).focusedUnitId);
  });

  it("pages rather than dumping every result into one message", async () => {
    await paidTenant();
    const first = await handleMessage({ from: PHONE, text: "any home" });
    const shown = first.conversation.shownUpTo;

    if (first.conversation.lastResults.length > shown) {
      const next = await handleMessage({ from: PHONE, text: "show me more" });
      expect(next.conversation.shownUpTo).toBeGreaterThan(shown);
    }
  });
});

describe("continuing a conversation", () => {
  it("refines the existing search instead of starting over", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });

    const { conversation } = await handleMessage({ from: PHONE, text: "only ones with parking" });
    expect(conversation.criteria).toMatchObject({ bedrooms: 2, location: "Mikocheni", maxRent: 700_000 });
    expect(conversation.criteria.amenities).toContain("parking");
  });

  it("takes a change of budget without losing the rest", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });

    const { conversation } = await handleMessage({ from: PHONE, text: "actually increase the budget to 800k" });
    expect(conversation.criteria.maxRent).toBe(800_000);
    expect(conversation.criteria.location).toBe("Mikocheni");
  });

  it("takes a change of area", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });

    const { conversation } = await handleMessage({ from: PHONE, text: "forget Mikocheni, try Sinza" });
    expect(conversation.criteria.location).toBe("Sinza");
    expect(conversation.criteria.bedrooms).toBe(2);
  });

  it("starts clean when asked to", async () => {
    await freeTenant();
    await handleMessage({ from: PHONE, text: "2 bedroom Mikocheni under 700k" });
    const { conversation } = await handleMessage({ from: PHONE, text: "start over" });
    expect(conversation.criteria.location).toBeUndefined();
  });
});

describe("no results", () => {
  it("offers alternatives that are real, not encouragement", async () => {
    await freeTenant();
    const { messages } = await handleMessage({
      from: PHONE,
      text: "5 bedroom in Kariakoo under 60k with a pool",
    });

    const body = textOf(messages);
    expect(body).toContain("couldn't find");
    expect(body).not.toMatch(/\bI found\b/);
  });
});
