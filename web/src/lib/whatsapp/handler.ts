/**
 * The WhatsApp conversation manager.
 *
 * This is the only place WhatsApp-specific *behaviour* lives, and it contains
 * no search logic, no ranking, no pricing and no access rules. It reads the
 * message, updates the conversation, and calls the same services the app calls:
 *
 *     message → intent + criteria → searchProperties() → entitlement → reply
 *
 * It returns messages rather than sending them, so the whole conversation —
 * paywall included — is testable without a Meta app or a network.
 *
 * Two invariants hold throughout, and the tests assert both:
 *   • The count a free user is told is the genuine search count.
 *   • A free user's reply never contains a property name, address, photo,
 *     landlord or exact rent. WhatsApp is not a way around the TZS 10,000.
 */

import { entitlementForAccount } from "@/lib/access/session";
import { ANONYMOUS, isMember, type Entitlement } from "@/lib/access/entitlement";
import { toMemberView, type MemberProperty } from "@/lib/access/redact";
import { findAccountByPhone, getAccount, saveProperty } from "@/lib/accounts/store";
import { getLiveUnit, knownPlaces } from "@/lib/data/catalogue";
import { organizations } from "@/lib/data/seed";
import type { Locale } from "@/lib/i18n/config";
import { isActionable, nextQuestion, parseCriteria, refineCriteria } from "@/lib/search/criteria";
import { searchProperties, similarTo, type Suggestion } from "@/lib/search/service";
import { getConversation, resetConversation, saveConversation, type Conversation } from "./conversation";
import { detectLocale, phrase } from "./phrases";

// ── Outbound shapes. The webhook turns these into Graph API calls. ──────

export type Outbound =
  | { kind: "text"; body: string }
  | { kind: "buttons"; body: string; buttons: { id: string; title: string }[] }
  | { kind: "list"; body: string; buttonLabel: string; rows: { id: string; title: string; description?: string }[] }
  | { kind: "link"; body: string; url: string; label: string }
  | { kind: "image"; url: string; caption?: string };

export interface InboundMessage {
  from: string;
  /** Text body, or the title of the button/row the tenant tapped. */
  text: string;
  /** The id behind an interactive reply, when there was one. */
  replyId?: string;
}

const PAGE_SIZE = 3;

const orgIndex = new Map(
  organizations.map((org) => [org.id, { name: org.name, contactPhone: org.contactPhone, isVerified: org.isVerified }]),
);

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaatz.vercel.app";
  return `${base.replace(/\/$/, "")}${path}`;
}

function money(amount: number) {
  return `TZS ${amount.toLocaleString("en-US")}`;
}

// ── Intent ─────────────────────────────────────────────────────────────

type Intent =
  | { kind: "greeting" }
  | { kind: "pick"; index: number }
  | { kind: "more" }
  | { kind: "restart" }
  | { kind: "save" }
  | { kind: "viewing" }
  | { kind: "similar" }
  | { kind: "paid" }
  | { kind: "describe" };

function readIntent(message: InboundMessage, conversation: Conversation): Intent {
  const id = message.replyId ?? "";
  if (id.startsWith("unit:")) return { kind: "pick", index: -1 };
  if (id === "more") return { kind: "more" };
  if (id === "save") return { kind: "save" };
  if (id === "viewing") return { kind: "viewing" };
  if (id === "similar") return { kind: "similar" };

  const text = message.text.trim().toLowerCase();

  // Ahead of the greeting, because "start over" begins with "start".
  if (/^(restart|start over|start again|anza upya|reset|tangira bushya)\b/.test(text)) {
    return { kind: "restart" };
  }
  if (/^(hi|hello|hey|habari|mambo|salama|muraho|start|anza)\b/.test(text) && text.length < 24) {
    return { kind: "greeting" };
  }
  if (/\b(nimelipa|done|nimemaliza|nishalipa|i (?:have )?paid|payment done|narishyuye)\b/.test(text)) {
    return { kind: "paid" };
  }
  if (/\b(more|next|zaidi|nyingine|izindi|ikurikira)\b/.test(text) && text.length < 30) return { kind: "more" };
  if (/\b(save|hifadhi|bika)\b/.test(text) && text.length < 30) return { kind: "save" };
  if (/\b(view(ing)?|kuangalia|kuona nyumba|uruzinduko)\b/.test(text) && text.length < 40) {
    return { kind: "viewing" };
  }
  if (/\b(similar|zinazofanana|izisa)\b/.test(text)) return { kind: "similar" };

  // "number 2", "namba 2", "the second one", or a bare "2" while a result set
  // is on screen. A bare number outside that context is a budget or a bedroom
  // count, so it is only read as a pick when there is something to pick from.
  const numbered = /(?:number|namba|nimero|no\.?)\s*(\d{1,2})/.exec(text);
  if (numbered) return { kind: "pick", index: Number(numbered[1]) - 1 };

  if (conversation.state === "SHOWING_RESULTS" && /^\d{1,2}$/.test(text)) {
    return { kind: "pick", index: Number(text) - 1 };
  }

  return { kind: "describe" };
}

// ── Formatting ─────────────────────────────────────────────────────────

function summariseCriteria(conversation: Conversation): string {
  const { criteria } = conversation;
  const lines: string[] = [];
  if (criteria.bedrooms) lines.push(`🛏️ ${criteria.bedrooms} bedroom${criteria.bedrooms === 1 ? "" : "s"}`);
  if (criteria.location) lines.push(`📍 ${criteria.location}`);
  if (criteria.maxRent) lines.push(`💰 Up to ${money(criteria.maxRent)}`);
  if (criteria.minRent) lines.push(`💰 From ${money(criteria.minRent)}`);
  for (const amenity of criteria.amenities) {
    const icon = amenity === "parking" ? "🅿️" : amenity === "security" ? "🛡️" : amenity === "water_tank" ? "💧" : "•";
    lines.push(`${icon} ${amenity.replace(/_/g, " ")}`);
  }
  return lines.join("\n");
}

function suggestionLines(suggestions: Suggestion[], locale: Locale): string[] {
  return suggestions.map((suggestion) => {
    switch (suggestion.kind) {
      case "raise_budget":
        return phrase("suggestRaiseBudget", locale, {
          amount: suggestion.toAmount.toLocaleString("en-US"),
          count: suggestion.count,
        });
      case "nearby_ward":
        return phrase("suggestNearby", locale, { ward: suggestion.ward, count: suggestion.count });
      case "drop_amenity":
        return phrase("suggestDropAmenity", locale, {
          amenity: suggestion.amenity.replace(/_/g, " "),
          count: suggestion.count,
        });
      case "any_bedrooms":
        return phrase("suggestAnyBedrooms", locale, { count: suggestion.count });
    }
  });
}

/** A paid result card. Only ever built for a member. */
function propertyLines(property: MemberProperty, locale: Locale): string {
  const amenities = property.amenities
    .map((amenity) => (locale === "sw" ? amenity.sw : amenity.en))
    .slice(0, 6);

  return [
    `🏠 *${property.headline}*`,
    "",
    `📍 ${property.ward}`,
    `💰 ${money(property.rentAmount)} ${phrase("perMonth", locale)}`,
    "",
    `🛏️ ${property.bedrooms}`,
    `🚿 ${property.bathrooms}`,
    ...amenities.map((label) => `• ${label}`),
    "",
    `${phrase("available", locale)}${property.availableFrom ? ` — ${property.availableFrom}` : ""}`,
    `${property.advanceMonths} months upfront, ${property.depositMonths} month deposit`,
    `Move in: ${money(property.moveInCost)}`,
  ].join("\n");
}

// ── The paywall reply ──────────────────────────────────────────────────

/**
 * What a free user gets: the honest count, their own criteria read back, and
 * the price. No names, no photos, no rents, no addresses.
 */
function lockedReply(count: number, conversation: Conversation, locale: Locale): Outbound[] {
  const summary = summariseCriteria(conversation);
  const countLine = phrase(count === 1 ? "foundCountOne" : "foundCount", locale, { count });

  return [
    {
      kind: "link",
      body: [summary, "", countLine, "", phrase("locked", locale)].filter(Boolean).join("\n"),
      url: appUrl("/app/unlock?from=whatsapp"),
      label: phrase("unlockButton", locale),
    },
  ];
}

// ── Handler ────────────────────────────────────────────────────────────

export interface HandledTurn {
  messages: Outbound[];
  conversation: Conversation;
}

async function resolveIdentity(phone: string, conversation: Conversation) {
  const account = conversation.accountId
    ? await getAccount(conversation.accountId)
    : await findAccountByPhone(phone);

  const entitlement: Entitlement = account ? await entitlementForAccount(account.id) : ANONYMOUS;
  return { account, entitlement };
}

export async function handleMessage(message: InboundMessage): Promise<HandledTurn> {
  let conversation = getConversation(message.from);
  const { account, entitlement } = await resolveIdentity(message.from, conversation);

  if (account && conversation.accountId !== account.id) {
    conversation = saveConversation({ ...conversation, accountId: account.id });
  }

  // The account's chosen language wins; otherwise read it off what they wrote.
  const locale: Locale = account?.preferredLanguage ?? detectLocale(message.text) ?? "sw";
  const places = knownPlaces();
  const intent = readIntent(message, conversation);

  switch (intent.kind) {
    case "greeting":
      conversation = saveConversation({ ...conversation, state: "IDLE" });
      return { messages: [{ kind: "text", body: phrase("greeting", locale) }], conversation };

    case "restart":
      resetConversation(message.from);
      conversation = getConversation(message.from);
      return { messages: [{ kind: "text", body: phrase("greeting", locale) }], conversation };

    case "paid":
      return handlePaidClaim(conversation, entitlement, locale);

    case "more":
      return showResults(conversation, entitlement, locale, { advance: true });

    case "pick":
      return showProperty(message, intent.index, conversation, entitlement, locale);

    case "save":
      return handleSave(conversation, entitlement, locale);

    case "viewing":
      return handleViewing(conversation, entitlement, locale);

    case "similar":
      return handleSimilar(conversation, entitlement, locale);

    case "describe":
      return handleDescription(message, conversation, entitlement, locale, places);
  }
}

async function handleDescription(
  message: InboundMessage,
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
  places: string[],
): Promise<HandledTurn> {
  // A follow-up refines the existing search rather than replacing it, which is
  // what makes "actually make it 800k" work without repeating everything.
  const criteria =
    conversation.state === "IDLE" && !isActionable(conversation.criteria)
      ? parseCriteria(message.text, places)
      : refineCriteria(conversation.criteria, message.text, places);

  let next = saveConversation({ ...conversation, criteria, shownUpTo: 0 });

  if (!isActionable(criteria)) {
    const question = nextQuestion(criteria);
    const key = question === "budget" ? "askBudget" : question === "bedrooms" ? "askBedrooms" : "askLocation";
    const state = question === "budget" ? "AWAITING_BUDGET" : question === "bedrooms" ? "AWAITING_BEDROOMS" : "AWAITING_LOCATION";
    next = saveConversation({ ...next, state });
    return {
      messages: [
        { kind: "text", body: phrase("didNotUnderstand", locale) },
        { kind: "text", body: phrase(key, locale) },
      ],
      conversation: next,
    };
  }

  // "Find me a 2 bedroom under 900k" is enough to search on. Asking where as
  // well would be a form, and the brief is explicit that a tenant who has
  // already said enough should not be made to answer more.
  const stated =
    (criteria.location ? 1 : 0) +
    (criteria.bedrooms !== undefined ? 1 : 0) +
    (criteria.maxRent !== undefined ? 1 : 0) +
    (criteria.amenities.length ? 1 : 0);

  if (stated < 2 && !criteria.location) {
    next = saveConversation({ ...next, state: "AWAITING_LOCATION" });
    return { messages: [{ kind: "text", body: phrase("askLocation", locale) }], conversation: next };
  }

  return runSearch(next, entitlement, locale);
}

async function runSearch(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): Promise<HandledTurn> {
  const result = searchProperties(conversation.criteria);

  let next = saveConversation({
    ...conversation,
    state: result.count === 0 ? "SEARCHING" : isMember(entitlement) ? "SHOWING_RESULTS" : "AWAITING_SUBSCRIPTION",
    lastResults: result.matches.map((row) => row.unit.id),
    shownUpTo: 0,
  });

  if (result.count === 0) {
    const lines = suggestionLines(result.suggestions, locale);
    return {
      messages: [
        {
          kind: "text",
          body: [
            phrase("noResults", locale),
            "",
            ...(lines.length ? [phrase("wouldYouLike", locale), "", ...lines] : []),
          ].join("\n"),
        },
      ],
      conversation: next,
    };
  }

  if (!isMember(entitlement)) {
    // Search was free and genuine. The houses are not.
    return { messages: lockedReply(result.count, next, locale), conversation: next };
  }

  next = saveConversation({ ...next, state: "SHOWING_RESULTS" });
  return showResults(next, entitlement, locale, { advance: false, announce: true });
}

function showResults(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
  options: { advance: boolean; announce?: boolean },
): HandledTurn {
  if (!isMember(entitlement)) {
    return {
      messages: lockedReply(conversation.lastResults.length, conversation, locale),
      conversation,
    };
  }

  const from = options.advance ? conversation.shownUpTo : 0;
  const page = conversation.lastResults.slice(from, from + PAGE_SIZE);

  if (!page.length) {
    return { messages: [{ kind: "text", body: phrase("noMore", locale) }], conversation };
  }

  const next = saveConversation({ ...conversation, shownUpTo: from + page.length, state: "SHOWING_RESULTS" });

  const rows = page.flatMap((unitId, offset) => {
    const unit = getLiveUnit(unitId);
    if (!unit) return [];
    const position = from + offset + 1;
    return [
      {
        id: `unit:${unit.id}`,
        title: `${position}. ${unit.bedrooms} bed, ${unit.property.ward}`,
        description: `${money(unit.rentAmount)} ${phrase("perMonth", locale)}`,
      },
    ];
  });

  const body = [
    ...(options.announce
      ? [
          phrase(conversation.lastResults.length === 1 ? "foundCountOne" : "foundCount", locale, {
            count: conversation.lastResults.length,
          }),
          "",
        ]
      : []),
    phrase("strongestMatches", locale),
    "",
    ...page.flatMap((unitId, offset) => {
      const unit = getLiveUnit(unitId);
      if (!unit) return [];
      const position = from + offset + 1;
      return [
        `🏠 *${position}. ${unit.bedrooms} Bedroom*`,
        `📍 ${unit.property.ward}`,
        `💰 ${money(unit.rentAmount)} ${phrase("perMonth", locale)}`,
        "",
      ];
    }),
    phrase("whichOne", locale),
  ].join("\n");

  return {
    messages: [{ kind: "list", body, buttonLabel: phrase("viewOnKaa", locale), rows }],
    conversation: next,
  };
}

function showProperty(
  message: InboundMessage,
  index: number,
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): HandledTurn {
  if (!isMember(entitlement)) {
    return {
      messages: lockedReply(conversation.lastResults.length, conversation, locale),
      conversation,
    };
  }

  const fromReply = message.replyId?.startsWith("unit:") ? message.replyId.slice(5) : undefined;
  const unitId = fromReply ?? conversation.lastResults[index];
  const unit = unitId ? getLiveUnit(unitId) : undefined;

  if (!unit) {
    return { messages: [{ kind: "text", body: phrase("notFound", locale) }], conversation };
  }

  const property = toMemberView(unit, orgIndex.get(unit.property.orgId));
  const next = saveConversation({ ...conversation, state: "VIEWING_PROPERTY", focusedUnitId: unit.id });

  const messages: Outbound[] = [];

  // Only real photos. If the listing has none, nothing is fabricated.
  for (const image of property.images.slice(0, 3)) {
    messages.push({ kind: "image", url: image });
  }

  messages.push({
    kind: "buttons",
    body: [propertyLines(property, locale), "", appUrl(`/app/listing/${unit.id}`), "", phrase("actionsPrompt", locale)].join("\n"),
    buttons: [
      { id: "viewing", title: phrase("arrangeViewing", locale) },
      { id: "save", title: phrase("saveProperty", locale) },
      { id: "similar", title: phrase("findSimilar", locale) },
    ],
  });

  return { messages, conversation: next };
}

async function handleSave(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): Promise<HandledTurn> {
  if (!isMember(entitlement) || !entitlement.accountId) {
    return {
      messages: [
        {
          kind: "link",
          body: `${phrase("locked", locale)}\n\n${phrase("linkAccount", locale)}`,
          url: appUrl("/app/unlock?from=whatsapp"),
          label: phrase("unlockButton", locale),
        },
      ],
      conversation,
    };
  }

  if (!conversation.focusedUnitId) {
    return { messages: [{ kind: "text", body: phrase("notFound", locale) }], conversation };
  }

  // The same saved-properties store the app reads. One list, everywhere.
  await saveProperty(entitlement.accountId, conversation.focusedUnitId);
  return { messages: [{ kind: "text", body: phrase("saved", locale) }], conversation };
}

function handleViewing(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): HandledTurn {
  if (!isMember(entitlement)) {
    return {
      messages: [
        {
          kind: "link",
          body: phrase("locked", locale),
          url: appUrl("/app/unlock?from=whatsapp"),
          label: phrase("unlockButton", locale),
        },
      ],
      conversation,
    };
  }

  if (!conversation.focusedUnitId) {
    return { messages: [{ kind: "text", body: phrase("notFound", locale) }], conversation };
  }

  const next = saveConversation({ ...conversation, state: "BOOKING_VIEWING" });
  return { messages: [{ kind: "text", body: phrase("askViewingTime", locale) }], conversation: next };
}

function handleSimilar(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): HandledTurn {
  if (!isMember(entitlement)) {
    return { messages: lockedReply(conversation.lastResults.length, conversation, locale), conversation };
  }

  const unit = conversation.focusedUnitId ? getLiveUnit(conversation.focusedUnitId) : undefined;
  if (!unit) return { messages: [{ kind: "text", body: phrase("notFound", locale) }], conversation };

  const similar = similarTo(unit, 5);
  const next = saveConversation({
    ...conversation,
    lastResults: similar.map((row) => row.unit.id),
    shownUpTo: 0,
    state: "SHOWING_RESULTS",
  });

  if (!similar.length) return { messages: [{ kind: "text", body: phrase("noMore", locale) }], conversation: next };
  return showResults(next, entitlement, locale, { advance: false });
}

/**
 * "Done", "nimelipa". The tenant's word is not evidence — this re-reads the
 * subscription state, which only the provider webhook can have changed.
 */
async function handlePaidClaim(
  conversation: Conversation,
  entitlement: Entitlement,
  locale: Locale,
): Promise<HandledTurn> {
  if (!isMember(entitlement)) {
    return {
      messages: [
        {
          kind: "link",
          body: phrase("locked", locale),
          url: appUrl("/app/unlock?from=whatsapp"),
          label: phrase("unlockButton", locale),
        },
      ],
      conversation,
    };
  }

  const turn = showResults(
    saveConversation({ ...conversation, state: "SHOWING_RESULTS", shownUpTo: 0 }),
    entitlement,
    locale,
    { advance: false, announce: true },
  );

  return {
    messages: [{ kind: "text", body: phrase("welcomeMember", locale) }, ...turn.messages],
    conversation: turn.conversation,
  };
}
