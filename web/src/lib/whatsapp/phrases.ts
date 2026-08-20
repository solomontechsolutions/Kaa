/**
 * What Kaa says on WhatsApp, in the three languages.
 *
 * Kept apart from the app dictionary because the register is different — this
 * is a person texting, not a screen labelling itself. The tenant's language
 * comes from their Kaa account when the number is linked, and otherwise from
 * what they wrote: someone who opens with "habari" should not be answered in
 * English.
 */

import type { Locale } from "@/lib/i18n/config";

type Phrase = Record<Locale, string>;

export const PHRASES = {
  greeting: {
    sw: "Habari 👋 Karibu Kaa.\n\nNiambie unatafuta nyumba ya aina gani. Eleza tu kwa maneno yako.\n\nKwa mfano:\n_\"Nataka vyumba 2 Mbezi chini ya 500k na maegesho.\"_",
    en: "Hi 👋 Welcome to Kaa.\n\nTell me what kind of home you're looking for. You can describe it normally.\n\nFor example:\n_\"I need a 2 bedroom in Mbezi under 500k with parking.\"_",
    rw: "Muraho 👋 Murakaza neza kuri Kaa.\n\nMbwira ubwoko bw'inzu ushaka. Sobanura gusa mu magambo yawe.\n\nUrugero:\n_\"Nshaka ibyumba 2 i Mbezi munsi ya 500k hamwe n'aho gupaka.\"_",
  },
  askLocation: {
    sw: "Sawa. Unatafuta eneo gani?",
    en: "Sure. Which area are you looking in?",
    rw: "Sawa. Ni ahantu he ushaka?",
  },
  askBudget: {
    sw: "Sawa. Ungependa kulipa kiasi gani kwa mwezi?",
    en: "Got it. What monthly rent would you like to stay within?",
    rw: "Byakunze. Ni angahe ushaka kwishyura buri kwezi?",
  },
  askBedrooms: {
    sw: "Sawa. Unahitaji vyumba vingapi vya kulala?",
    en: "Got it. How many bedrooms do you need?",
    rw: "Byakunze. Ukeneye ibyumba bingahe byo kuraramo?",
  },
  checking: {
    sw: "Ngoja nikuangalie kilichopo...",
    en: "Let me check what's available...",
    rw: "Reka nrebe ibiboneka...",
  },
  gotIt: { sw: "Nimekuelewa 👌", en: "Got it 👌", rw: "Nabyumvise 👌" },
  foundCount: {
    sw: "Nimepata nyumba *{count}* zinazopatikana zinazokidhi mahitaji yako.",
    en: "I found *{count} available properties* matching your requirements.",
    rw: "Nabonye inzu *{count}* ziboneka zujuje ibyo usaba.",
  },
  foundCountOne: {
    sw: "Nimepata nyumba *1* inayopatikana inayokidhi mahitaji yako.",
    en: "I found *1 available property* matching your requirements.",
    rw: "Nabonye inzu *1* iboneka yujuje ibyo usaba.",
  },
  locked: {
    sw: "🔒 Nyumba zenyewe ni kwa wanachama wa Kaa.\n\nFungua matumizi kamili kwa *TSh 10,000* kwa miezi 12.",
    en: "🔒 The houses are available to Kaa members.\n\nUnlock full property access for *TZS 10,000* a year.",
    rw: "🔒 Inzu ubwazo ni iz'abanyamuryango ba Kaa.\n\nFungura byose kuri *TZS 10,000* mu mezi 12.",
  },
  unlockButton: { sw: "Fungua Kaa", en: "Unlock Kaa", rw: "Fungura Kaa" },
  noResults: {
    sw: "Sijapata nyumba inayokidhi mahitaji yako yote kwa sasa.",
    en: "I couldn't find a property that matches all your requirements right now.",
    rw: "Sinabonye inzu yujuje ibyo usaba byose ubu.",
  },
  wouldYouLike: {
    sw: "Ungependa nifanye nini?",
    en: "Would you like me to:",
    rw: "Wifuza ko nakora iki?",
  },
  strongestMatches: {
    sw: "Hizi ndizo zinazolingana zaidi:",
    en: "Here are the strongest matches:",
    rw: "Izi ni zo zihuye kurusha izindi:",
  },
  whichOne: {
    sw: "Ungependa kuona ipi? Andika namba yake, au sema _zaidi_ kuona nyingine.",
    en: "Which one would you like to see? Reply with its number, or say _more_ for others.",
    rw: "Ni iyihe wifuza kureba? Andika nimero yayo, cyangwa uvuge _izindi_.",
  },
  noMore: {
    sw: "Hizo ndizo zote nilizonazo kwa utafutaji huu.",
    en: "That's everything I have for this search.",
    rw: "Izo ni zo zose mfite kuri ubu bushakashatsi.",
  },
  welcomeMember: {
    sw: "Sasa wewe ni mwanachama wa Kaa ✓",
    en: "You're now a Kaa member ✓",
    rw: "Ubu uri umunyamuryango wa Kaa ✓",
  },
  notFound: {
    sw: "Sijaipata hiyo. Jaribu namba kutoka kwenye orodha hapo juu.",
    en: "I couldn't find that one. Try a number from the list above.",
    rw: "Sinabonye iyo. Gerageza nimero iri ku rutonde hejuru.",
  },
  linkAccount: {
    sw: "Ili kuhifadhi nyumba au kupanga kwenda kuangalia, unahitaji akaunti ya Kaa iliyothibitishwa kwa NIDA.",
    en: "To save a home or arrange a viewing you need a Kaa account verified with NIDA.",
    rw: "Kugira ngo ubike inzu cyangwa utegure uruzinduko, ukeneye konti ya Kaa yemejwe na NIDA.",
  },
  createAccountButton: { sw: "Fungua akaunti", en: "Create account", rw: "Fungura konti" },
  saved: { sw: "Imehifadhiwa ✓", en: "Saved ✓", rw: "Yabitswe ✓" },
  askViewingTime: {
    sw: "Ungependa kwenda kuangalia lini?",
    en: "When would you like to view it?",
    rw: "Ni ryari wifuza kuyireba?",
  },
  viewingRequested: {
    sw: "✅ Ombi la kwenda kuangalia limetumwa\n\nKumbukumbu: {reference}\nTutakujulisha mwenye nyumba atakapothibitisha.",
    en: "✅ Viewing request sent\n\nReference: {reference}\nI'll let you know as soon as the landlord confirms.",
    rw: "✅ Icyifuzo cyo kureba cyoherejwe\n\nInomero: {reference}\nNzakumenyesha nyir'inzu abyemeje.",
  },
  actionsPrompt: {
    sw: "Ungependa kufanya nini?",
    en: "What would you like to do?",
    rw: "Wifuza gukora iki?",
  },
  arrangeViewing: { sw: "Panga kuangalia", en: "Arrange viewing", rw: "Tegura kureba" },
  saveProperty: { sw: "Hifadhi nyumba", en: "Save property", rw: "Bika inzu" },
  findSimilar: { sw: "Zinazofanana", en: "Find similar", rw: "Izisa na yo" },
  didNotUnderstand: {
    sw: "Sijaelewa vizuri. Eleza nyumba unayotaka — eneo, bajeti na vyumba.",
    en: "I didn't quite get that. Describe the home you want — area, budget and bedrooms.",
    rw: "Sinabyumvise neza. Sobanura inzu ushaka — ahantu, ingengo y'imari n'ibyumba.",
  },
  available: { sw: "Inapatikana sasa", en: "Available now", rw: "Iraboneka ubu" },
  viewOnKaa: { sw: "Fungua kwenye Kaa", en: "View on Kaa", rw: "Fungura kuri Kaa" },
  perMonth: { sw: "kwa mwezi", en: "per month", rw: "ku kwezi" },
  suggestRaiseBudget: {
    sw: "• Ongeza bajeti hadi TSh {amount} — kuna {count}",
    en: "• Raise the budget to TZS {amount} — {count} available",
    rw: "• Zamura ingengo kugera kuri TZS {amount} — hari {count}",
  },
  suggestNearby: {
    sw: "• Angalia {ward} — kuna {count}",
    en: "• Try {ward} — {count} available",
    rw: "• Gerageza {ward} — hari {count}",
  },
  suggestDropAmenity: {
    sw: "• Ondoa hitaji la {amenity} — kuna {count}",
    en: "• Drop the {amenity} requirement — {count} available",
    rw: "• Kuraho icyifuzo cya {amenity} — hari {count}",
  },
  suggestAnyBedrooms: {
    sw: "• Kubali vyumba vyovyote — kuna {count}",
    en: "• Accept any number of bedrooms — {count} available",
    rw: "• Wemere ibyumba ibyo ari byo byose — hari {count}",
  },
} satisfies Record<string, Phrase>;

export type PhraseKey = keyof typeof PHRASES;

export function phrase(key: PhraseKey, locale: Locale, values?: Record<string, string | number>): string {
  const template = PHRASES[key][locale] ?? PHRASES[key].sw;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/**
 * Guess the language from what the tenant wrote. Only used when the number is
 * not yet linked to an account — once it is, the account's preference wins.
 */
export function detectLocale(message: string): Locale | null {
  const lower = ` ${message.toLowerCase()} `;
  const swahili = /\b(habari|mambo|shikamoo|nyumba|vyumba|nataka|natafuta|bei|kodi|maegesho|ndio|sawa|karibu|asante|tafadhali|elfu|milioni)\b/;
  const kinyarwanda = /\b(muraho|nshaka|inzu|ibyumba|amafaranga|murakoze|yego|oya|nkeneye|ubukode|hano)\b/;

  if (kinyarwanda.test(lower)) return "rw";
  if (swahili.test(lower)) return "sw";
  if (/\b(hi|hello|hey|i need|looking for|bedroom|budget|parking|please|thanks)\b/.test(lower)) return "en";
  return null;
}
