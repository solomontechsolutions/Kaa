/**
 * Turning what a tenant said into something Kaa can query.
 *
 * Nobody types `bedrooms=2&max_rent=700000`. They type "2 bedroom Mikocheni
 * under 700k with parking", or "vyumba viwili Sinza mpaka laki saba", or they
 * say it on WhatsApp in the middle of a sentence. This module normalises all
 * of that into one structured shape.
 *
 * It is deliberately deterministic — regex and vocabulary, no model call.
 * Two reasons. A language model cannot be allowed to invent a budget the
 * tenant never gave, and extraction has to work identically on the web form,
 * the mobile search bar and the WhatsApp webhook. When a model is added later
 * it sits *in front* of this as an optional normaliser, never in place of it.
 */

export interface SearchCriteria {
  /** Ward or district name, as written in the catalogue. */
  location?: string;
  bedrooms?: number;
  minBedrooms?: number;
  maxRent?: number;
  minRent?: number;
  /** Amenity slugs, matching `amenityLabels` in the seed / `amenities.slug`. */
  amenities: string[];
  /** Free text left over, kept for ranking and for asking a better question. */
  text?: string;
}

export const EMPTY_CRITERIA: SearchCriteria = { amenities: [] };

// ── Vocabulary ─────────────────────────────────────────────────────────

/**
 * Amenity synonyms in all three languages, plus the way people actually
 * write them. The tenant should never have to know Kaa's slugs.
 */
const AMENITY_SYNONYMS: Record<string, string[]> = {
  parking: [
    "parking", "car park", "carpark", "parking space", "park the car", "garage",
    "maegesho", "egesho", "pa kuegesha", "kuegesha gari",
    "aho gupaka", "parikingi",
  ],
  security: [
    "security", "secure", "secure place", "guard", "guarded", "24h security", "24 hour security", "gated",
    "ulinzi", "usalama", "mlinzi", "sekyuriti",
    "umutekano", "umuzamu",
  ],
  water_tank: [
    "water tank", "tank", "reliable water", "constant water", "steady water", "water storage", "always water",
    "tanki", "tanki la maji", "maji ya uhakika", "maji ya kutosha", "maji muda wote",
    "itanki y'amazi", "amazi ahoraho",
  ],
  borehole: ["borehole", "own water", "well", "kisima", "kisima cha maji", "iriba"],
  shared_water: ["shared water", "maji ya pamoja", "amazi asangiwe"],
  generator: [
    "generator", "genset", "backup power", "standby power", "power backup",
    "jenereta", "umeme wa dharura",
    "jenerateri", "amashanyarazi y'inyongera",
  ],
  luku: ["luku", "luku meter", "prepaid meter", "own meter", "mita ya luku", "mita yake"],
  balcony: ["balcony", "veranda", "verandah", "baraza", "baraza la nje", "baruka"],
  aircon: [
    "aircon", "air con", "air conditioning", "ac", "a/c", "air-conditioned",
    "kiyoyozi", "eyakondishena", "ac ya chumba",
  ],
  lift: ["lift", "elevator", "lifti", "asenseri"],
  garden: ["garden", "yard", "compound", "bustani", "ua", "ubusitani"],
  pool: ["pool", "swimming pool", "bwawa", "bwawa la kuogelea", "pisine"],
  staff_quarters: [
    "staff quarters", "servant quarters", "boys quarters", "sq",
    "chumba cha mfanyakazi", "chumba cha msaidizi",
    "icyumba cy'umukozi",
  ],
};

/** Words that mean "this number is a ceiling". */
const MAX_MARKERS = [
  "under", "below", "less than", "no more than", "not more than", "at most", "up to",
  "maximum", "max", "budget", "within", "cheaper than",
  "chini ya", "pungufu ya", "isiyozidi", "hadi", "mpaka", "bajeti", "si zaidi ya", "kiasi cha",
  "munsi ya", "itarenga", "ingengo", "kugeza kuri",
];

/** Words that mean "this number is a floor". */
const MIN_MARKERS = [
  "over", "above", "more than", "at least", "starting from", "from",
  "zaidi ya", "kuanzia", "juu ya",
  "hejuru ya", "guhera kuri",
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5, sita: 6, saba: 7, nane: 8, tisa: 9, kumi: 10,
  // Swahili adjectival agreement for `vyumba` (ki-/vi- class).
  kimoja: 1, viwili: 2, vitatu: 3, vinne: 4, vitano: 5, sita_vi: 6,
  rimwe: 1, bibiri: 2, bitatu: 3, bine: 4, bitanu: 5, bitandatu: 6, birindwi: 7,
};

const BEDROOM_WORDS = [
  "bedroom", "bedrooms", "bed", "beds", "br", "bdrm", "roomed", "room",
  "chumba", "vyumba", "vyumba vya kulala", "chumba cha kulala",
  "icyumba", "ibyumba", "ibyumba byo kuraramo",
];

// ── Money ──────────────────────────────────────────────────────────────

/**
 * `500k` → 500000, `2m` → 2000000, `1.5m` → 1500000, `700,000` → 700000,
 * `elfu 500` → 500000, `milioni 2` → 2000000, `half a million` → 500000.
 *
 * Bare small numbers are treated as thousands, because "budget 500" in
 * Tanzania means 500,000 shillings and never five hundred.
 */
export function parseMoney(input: string): number | null {
  const text = input.toLowerCase().trim();

  if (/half a million|nusu milioni|kimwe cya kabiri/.test(text)) return 500_000;

  // milioni 2 / elfu 500 / miliyoni ebyiri
  const swahiliScale = /(milioni|miliyoni|elfu)\s*([\d.,]+|\w+)/.exec(text);
  if (swahiliScale) {
    const scale = swahiliScale[1].startsWith("elfu") ? 1_000 : 1_000_000;
    const raw = swahiliScale[2];
    const value = /^[\d.,]+$/.test(raw) ? Number(raw.replace(/,/g, "")) : NUMBER_WORDS[raw];
    if (value) return Math.round(value * scale);
  }

  // 500k / 2m / 1.5m / 750K
  const suffixed = /(\d+(?:[.,]\d+)?)\s*(k|m)\b/.exec(text);
  if (suffixed) {
    const value = Number(suffixed[1].replace(",", "."));
    return Math.round(value * (suffixed[2] === "k" ? 1_000 : 1_000_000));
  }

  // two million / 2 million / three hundred thousand
  const wordScale = /([\w.]+)\s+(million|thousand)/.exec(text);
  if (wordScale) {
    const scale = wordScale[2] === "million" ? 1_000_000 : 1_000;
    const value = /^[\d.]+$/.test(wordScale[1]) ? Number(wordScale[1]) : NUMBER_WORDS[wordScale[1]];
    if (value) return Math.round(value * scale);
  }

  // 700,000 / 700000 / 700 000
  const plain = /(\d[\d\s,]*\d|\d)/.exec(text);
  if (plain) {
    const value = Number(plain[1].replace(/[\s,]/g, ""));
    if (!Number.isFinite(value) || value <= 0) return null;
    // A rent of "500" is 500,000. Nothing in Tanzania rents for TZS 500.
    if (value < 1_000) return value * 1_000;
    return value;
  }

  return null;
}

// ── Extraction ─────────────────────────────────────────────────────────

/** Every money-like token in the message, with the words around it. */
function moneyMentions(text: string) {
  // The alternatives are ordered longest-first so "2 million" is taken whole
  // rather than as a bare "2" that then reads as TZS 2,000.
  const pattern =
    /((?:[a-z' ]{0,22})?)(\bhalf a million\b|\b[\w.]+\s+(?:million|thousand)\b|\b(?:milioni|miliyoni|elfu)\s*[\w.,]+|\b\d[\d\s,]*(?:[.,]\d+)?\s*(?:k|m)?\b)/g;
  const out: { lead: string; token: string; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    out.push({ lead: match[1] ?? "", token: match[2], index: match.index });
  }
  return out;
}

function isRentScale(value: number) {
  // Rent in Dar runs from roughly TZS 60,000 to TZS 8,000,000 a month. A "2"
  // sitting next to "bedroom" must never be read as TZS 2,000.
  return value >= 50_000 && value <= 20_000_000;
}

export function extractAmenities(text: string): string[] {
  const haystack = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const [slug, synonyms] of Object.entries(AMENITY_SYNONYMS)) {
    for (const synonym of synonyms) {
      // Word-boundary match so "ac" does not fire inside "back".
      const pattern = new RegExp(`(^|[^a-z'])${synonym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z']|$)`, "i");
      if (pattern.test(haystack)) {
        found.add(slug);
        break;
      }
    }
  }
  return [...found];
}

export function extractBedrooms(text: string): number | undefined {
  const lower = text.toLowerCase();
  const words = BEDROOM_WORDS.map((word) => word.replace(/\s/g, "\\s")).join("|");

  // "2 bedroom", "vyumba 2", "3 br"
  const numeric =
    new RegExp(`\\b(\\d{1,2})\\s*(?:-|\\s)?\\s*(?:${words})\\b`).exec(lower) ??
    new RegExp(`\\b(?:${words})\\s*(?:-|\\s)?\\s*(\\d{1,2})\\b`).exec(lower);
  if (numeric) {
    const value = Number(numeric[1]);
    if (value >= 1 && value <= 12) return value;
  }

  // "two bedroom", "vyumba viwili", "ibyumba bibiri". Both orders are tried
  // and each is checked against the number words — "natafuta vyumba viwili"
  // matches the first pattern with "natafuta", which is not a number, and the
  // answer is in the second.
  for (const pattern of [
    new RegExp(`\\b([a-z]+)\\s+(?:${words})\\b`),
    new RegExp(`\\b(?:${words})\\s+([a-z]+)\\b`),
  ]) {
    const match = pattern.exec(lower);
    if (match && NUMBER_WORDS[match[1]]) return NUMBER_WORDS[match[1]];
  }

  return undefined;
}

/** Every known place named in the message, in the order they were written. */
export function extractLocations(text: string, knownPlaces: string[]): string[] {
  const lower = ` ${text.toLowerCase()} `;
  // Longest name first, so "Mbezi Beach" wins over "Mbezi" where both exist.
  const sorted = [...knownPlaces].sort((a, b) => b.length - a.length);

  const found: { place: string; index: number }[] = [];
  for (const place of sorted) {
    const needle = place.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(^|[^a-z'])${needle}([^a-z']|$)`, "i").exec(lower);
    if (!match) continue;
    // Skip a shorter name already covered by a longer one at the same spot.
    if (found.some((other) => Math.abs(other.index - match.index) < 2)) continue;
    found.push({ place, index: match.index });
  }

  return found.sort((a, b) => a.index - b.index).map((row) => row.place);
}

export function extractLocation(text: string, knownPlaces: string[]): string | undefined {
  return extractLocations(text, knownPlaces)[0];
}

/**
 * Parse a whole message into criteria.
 *
 * `knownPlaces` comes from the catalogue, never from a hard-coded list — a
 * ward Kaa has not launched in is not a place the parser should recognise.
 */
export function parseCriteria(message: string, knownPlaces: string[] = []): SearchCriteria {
  const text = message.trim();
  const lower = text.toLowerCase();

  const criteria: SearchCriteria = {
    amenities: extractAmenities(text),
    text,
  };

  const bedrooms = extractBedrooms(text);
  if (bedrooms !== undefined) criteria.bedrooms = bedrooms;

  const location = extractLocation(text, knownPlaces);
  if (location) criteria.location = location;

  for (const mention of moneyMentions(lower)) {
    // A number that is the bedroom count is not a budget.
    const trailing = lower.slice(mention.index + mention.lead.length + mention.token.length, mention.index + mention.lead.length + mention.token.length + 14);
    if (new RegExp(`^\\s*(?:-|\\s)?\\s*(?:${BEDROOM_WORDS.join("|")})`).test(trailing)) continue;

    const value = parseMoney(mention.token);
    if (value === null || !isRentScale(value)) continue;

    const lead = mention.lead.toLowerCase();
    const isMin = MIN_MARKERS.some((marker) => lead.includes(marker));
    const isMax = MAX_MARKERS.some((marker) => lead.includes(marker));

    if (isMin && !isMax) {
      criteria.minRent = value;
    } else {
      // A budget with no qualifier is a ceiling. "Budget 450k" has never once
      // meant "please show me nothing under 450,000".
      criteria.maxRent = criteria.maxRent ? Math.min(criteria.maxRent, value) : value;
    }
  }

  return criteria;
}

/**
 * Fold a follow-up message into an existing search.
 *
 * "Only show me ones with parking" adds an amenity. "Actually make it 800k"
 * replaces the budget. "Forget Mikocheni, try Sinza" replaces the location.
 * Anything the follow-up does not mention is left alone — that is what makes
 * the conversation feel continuous instead of restarting every turn.
 */
export function refineCriteria(
  base: SearchCriteria,
  message: string,
  knownPlaces: string[] = [],
): SearchCriteria {
  const update = parseCriteria(message, knownPlaces);
  const lower = message.toLowerCase();

  const dropping = /\b(without|no|remove|drop|forget|bila|ondoa|sahau|nta|kuraho)\b/.test(lower);

  // "Forget Mikocheni, try Sinza" names two places. In a correction the new
  // one comes last, which is not true of a first search — hence the split.
  const mentioned = extractLocations(message, knownPlaces);
  const location = mentioned.length > 1 ? mentioned[mentioned.length - 1] : update.location;

  const next: SearchCriteria = {
    ...base,
    text: message,
    location: location ?? base.location,
    bedrooms: update.bedrooms ?? base.bedrooms,
    maxRent: update.maxRent ?? base.maxRent,
    minRent: update.minRent ?? base.minRent,
    amenities: [...base.amenities],
  };

  if (dropping && update.amenities.length) {
    next.amenities = base.amenities.filter((slug) => !update.amenities.includes(slug));
  } else {
    next.amenities = [...new Set([...base.amenities, ...update.amenities])];
  }

  return next;
}

/** Human-readable summary of a search, for confirming back to the tenant. */
export function describeCriteria(criteria: SearchCriteria): string[] {
  const parts: string[] = [];
  if (criteria.bedrooms) parts.push(`${criteria.bedrooms} bedroom${criteria.bedrooms === 1 ? "" : "s"}`);
  if (criteria.location) parts.push(criteria.location);
  if (criteria.maxRent) parts.push(`up to TZS ${criteria.maxRent.toLocaleString("en-US")}`);
  if (criteria.minRent) parts.push(`from TZS ${criteria.minRent.toLocaleString("en-US")}`);
  for (const slug of criteria.amenities) parts.push(slug.replace(/_/g, " "));
  return parts;
}

/** Enough to run a search without asking another question. */
export function isActionable(criteria: SearchCriteria): boolean {
  return Boolean(criteria.location || criteria.bedrooms || criteria.maxRent || criteria.amenities.length);
}

/** The single most useful thing still missing, or null if we can just search. */
export function nextQuestion(criteria: SearchCriteria): "location" | "budget" | "bedrooms" | null {
  if (!criteria.location) return "location";
  if (!criteria.maxRent) return "budget";
  if (!criteria.bedrooms) return "bedrooms";
  return null;
}

export { AMENITY_SYNONYMS };
