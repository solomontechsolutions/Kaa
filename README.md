# Kaa

**Stay. Settle. Belong.**

Kaa is Tanzania's rental platform. It connects people to verified rental homes directly from
landlords, removing the informal broker layer that currently charges tenants to view houses that are
often already let, misrepresented, or do not exist.

Roughly half of Dar es Salaam's households rent, and almost all of them find a home the same way: a
phone number, a broker, a fee, and hope. Kaa replaces that with listings that carry proof, a GPS pin
taken on site, photographs from that day, a landlord who confirmed the terms, and the real upfront
cost stated before anyone travels across the city.

---

## Surfaces

Kaa is **mobile first**. Tenant discovery lives in the app. Everything below is one codebase
deployed twice, and one database behind four interfaces.

| Surface | Deployment | Path | Audience |
|---|---|---|---|
| **Website** | `kaatz.vercel.app` | `/` | Public |
| **Kaa app** | `kaatz.vercel.app` | `/app` | Tenants |
| **Kaa Operators** | `kaatz.vercel.app` | `/operators` | Internal Kaa staff only — platform admin, reviews FieldOps submissions |
| **Landlord portal** | `kaatz.vercel.app` | `/landlord` | Landlords enrolled by FieldOps |
| **WhatsApp assistant** | webhook | `/api/whatsapp/webhook` | Tenants |
| **FieldOps portal** | `kaafieldops.vercel.app` | `/` | FieldOps supervisors, Kaa reviewers |
| **FieldOps field app** | `kaafieldops.vercel.app` | `/app` | FieldOps officers, on a PDU |

### FieldOps is a separate company

Not a section of Kaa. FieldOps is its own operating entity, jointly owned by Kaa and an established
dalali, and its employees are on its payroll. It collects property data on Kaa's behalf; Kaa reviews
that data and decides what enters its marketplace.

That is why it is a separate deployment (`NEXT_PUBLIC_KAA_SURFACE=fieldops`), why the tenant site
carries no link to it, and why the main deployment answers 404 for `/field` rather than redirecting.

It ships as two applications, because a supervisor at a desk and an officer at a gate want opposite
things:

- **`kaafieldops.vercel.app`** — the operations portal. Sidebar, dashboard, tables, officer
  management, activity, reports. Desktop-first; it works on a phone but that is not the target.
- **`kaafieldops.vercel.app/app`** — the field application. One-handed, offline-first, camera and
  GPS. Everything is written to the handset before it is sent, and uploads when a signal returns.

```text
FieldOps officer ─▶ collect on the PDU ─▶ upload
                                            │
                                    Kaa operator reviews
                                            │
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
                   send back with reasons               approve
                            │                               │
                     officer corrects              becomes a Kaa property
                            │
                        re-upload ─▶ back to the queue
```

An officer cannot approve their own work. That rule is in the service, in the route handlers and in
row-level security, and it is what the whole arrangement is for — the entity collecting the data is
not the entity accepting it.

### Landlords do not sign up

There is no landlord registration anywhere on this site, by design. Kaa Field Ops agents work a ward
at a time, find the empty units, trace the owner, explain Kaa at the gate, and enrol the property on
the spot — GPS fix, photographs, terms, and a recorded consent that the landlord agreed to it in
person. Kaa creates the landlord's account from that submission; the landlord signs in with the phone
number that was enrolled, at `/landlord` — a phone + OTP flow, not a password. The property then
appears in the Kaa app and in the WhatsApp assistant at the same moment, from the same database.

### Landlord, Kaa operator and FieldOps employee are three different logins

A landlord is a Kaa partner who lists property and watches their own portfolio at `/landlord`. A Kaa
operator is an internal Kaa employee who runs the platform — reviews listings, tenants, leases,
payments, maintenance, and FieldOps submissions — at `/operators`. Neither is FieldOps: FieldOps
employees collect property data for Kaa to review and never touch `/operators` or `/landlord`. The
three sign in through separate flows (`/landlord/sign-in`, `/operators/sign-in`,
`kaafieldops.vercel.app/sign-in`) and are enforced apart in `web/src/proxy.ts`, ahead of any page
rendering — not by a frontend redirect that a wrong-role visitor could just avoid.

---

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4**, Kaa design tokens defined in `web/src/app/globals.css`
- **Supabase**, Postgres + PostGIS, phone-OTP auth, storage, row level security
- **Recharts** for operator analytics · **lucide-react** for iconography
- **Poppins** via `next/font`, the brand typeface

### Running Kaa without Supabase

Supabase credentials are optional. With none configured, every surface resolves against the seed
dataset in `web/src/lib/data/seed.ts`, realistic Dar es Salaam properties, wards, rents, leases,
agents and submissions. Pages never touch a data source directly; they read through
`web/src/lib/data/queries.ts`, so swapping the seed for live Supabase queries changes one module.

---

## Getting started

```bash
npm --prefix web install
```

```bash
npm --prefix web run dev
```

Then open http://localhost:3000. Copy `web/.env.example` to `web/.env.local` when you are ready to
connect Supabase.

### Demo accounts

Seeded in `web/src/lib/demo/credentials.ts`, so the sign-in pages, the seed data and this table can
never drift apart. Each one signs in through the real flow for its role — there is no fake "log in as"
button anywhere.

| Role | How to sign in | Identity |
|---|---|---|
| Tenant | `/app` → NIDA number `19900101000000000012` (dev-mode NIDA recognises this exact number as "Demo Tenant") → phone OTP (code is written to the server log) | tenant@demo.kaa · +255 700 000 101 |
| Landlord | `/landlord/sign-in` → phone `+255 700 000 102` → OTP (server log) | landlord@demo.kaa |
| Kaa operator | `/operators/sign-in` → employee ID `KAA-OP-001` | operator@demo.kaa |
| FieldOps officer | `kaafieldops.vercel.app/sign-in` (or `/field/sign-in` when running the FieldOps deployment locally) → employee ID `FO-001` | fieldofficer@demo.kaa |
| FieldOps admin | same sign-in → employee ID `FO-ADMIN-001` | fieldadmin@demo.kaa |

The demo tenant already has an active Kaa membership and an active rental on the demo landlord's
Mbezi apartment (rent TSh 300,000, Kaa's charge TSh 30,000, total TSh 330,000) — the whole commercial
model is visible on both dashboards without any setup.

### Deploying

Vercel and Supabase setup, step by step, is in [DEPLOYMENT.md](DEPLOYMENT.md). The one setting
that catches people out: **Vercel's Root Directory must be `web`**, not the repository root.

### Checks

```bash
npm --prefix web run build
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
```

---

## Repository layout

```
├── web/
│   ├── src/app/(site)/         Public marketing site
│   ├── src/app/app/            The Kaa app (tenants)
│   ├── src/app/operators/      Kaa Operators portal (internal Kaa staff only)
│   ├── src/app/landlord/       Landlord portal
│   ├── src/app/field/          Kaa Field Ops portal (its own deployment)
│   ├── src/app/api/            Route handlers, incl. the WhatsApp webhook
│   ├── src/components/         Design system, brand, shell, surface components
│   ├── src/proxy.ts            Surface routing + role enforcement, ahead of every page render
│   └── src/lib/
│       ├── access/             Entitlements and the redaction boundary
│       ├── accounts/           NIDA, phone OTP, sessions, account store
│       ├── auth/                One Role enum, currentActor(), requireRole() across all three identity domains
│       ├── landlords/          Landlord identity: phone + OTP session, store
│       ├── pricing/            KAA_RENTAL_SERVICE_RATE and the rent/charge breakdown
│       ├── demo/               The single source of truth for every demo account's credentials
│       ├── data/               Seed dataset, org read model, tenant catalogue
│       ├── i18n/               Swahili, English, Kinyarwanda
│       ├── fieldops/           Submissions, workflow, permissions, offline queue
│       ├── search/             Criteria parsing and the ranked search service
│       ├── subscription/       Membership state machine
│       └── whatsapp/           Transport, conversation manager, phrasebook
│   └── tests/                  Vitest: access, paywall bypass, pricing, WhatsApp, i18n
├── supabase/                   Schema, storage buckets, reference data, CLI config
├── brand/                      Logo and brand board
├── docs/                       Business plan, investor material, market research
└── archive/                    Panga-era prototype, kept for reference only
```

---

## Domain model

The schema lives in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). The
pieces that matter:

- **Geography**, Tanzania's region → district → ward hierarchy. A ward is the unit of an agent's
  zone and of hyperlocal search.
- **Organizations**, the tenancy boundary for Operators. An individual landlord with two units and a
  manager with two hundred both get one.
- **Properties → units → media**, a unit carries `advance_months` alongside rent, because months
  demanded upfront is the number Tanzanian tenants actually get ambushed with.
- **Listing submissions**, the Field Ops → Operators review pipeline, carrying the GPS fix, its
  accuracy, and the capture timestamp as evidence.
- **Agent earnings**, a ledger, not a balance. TZS 2,000 per verified listing and TZS 5,000 per
  rental match, per the FieldOps agreement.
- **Leases, invoices, payments**, mobile money settlement with the provider fee recorded separately
  so it can be shown rather than buried.
- **FieldOps** ([`0004_fieldops.sql`](supabase/migrations/0004_fieldops.sql)), the separate entity's
  officers, submissions, photos, corrections and append-only audit trail. `kaa_unit_id` on a
  submission is the one bridge between FieldOps' records and Kaa's.
- **Tenant accounts, memberships, saved properties** ([`0003_tenant_accounts.sql`](supabase/migrations/0003_tenant_accounts.sql)),
  the tenant side. A NIDA number is stored only as a salted hash plus its last four digits. A
  membership has exactly one path to `active`, and saved properties are gated in the database as
  well as in the API.

Row level security is enabled on every table with a default-deny posture. Reference data is
world-readable, the public sees only `live` listings, org members see their own org, and an agent can
read their own earnings but never write them.

---

## Monetisation

Kaa makes money from the tenant, never from the landlord.

| Stream | Detail |
|---|---|
| Tenant membership | TZS 10,000 per year — search, viewings, the app |
| Kaa rental service charge | A recurring `KAA_RENTAL_SERVICE_RATE` (10% today) of the landlord's rent, billed to the tenant on top of it, for as long as the rental is active through Kaa. Defined once in `web/src/lib/pricing/service-charge.ts` |
| Landlord | TZS 0. No subscription, no commission, no listing fee — not once, not ever |
| Premium listings | Enhanced placement for landlords, still free to list (planned) |
| Value-added services | Tenant screening, document verification, rental insurance (planned) |

The landlord's rent and Kaa's service charge are two separate numbers everywhere — the database, the
API, the tenant and landlord UI — never combined into one stored figure. See
`web/src/lib/pricing/service-charge.ts` and its tests in `web/tests/pricing.test.ts`.

---

## Status

Built and working:

- **Role-based authentication and routing** for five roles — tenant, landlord, Kaa operator, FieldOps
  officer, FieldOps admin — enforced in `web/src/proxy.ts` ahead of any page render, not by a
  frontend redirect. A landlord signing in never lands on `/operators`; a Kaa operator, tenant or
  FieldOps employee hitting another role's portal is bounced to their own. Demo accounts for every
  role are seeded and documented below.
- **The landlord portal** at `/landlord`: phone + OTP sign-in, a dashboard scoped to the landlord's
  own properties, rent shown separately from Kaa's charge, and an explicit "Kaa charges you TSh 0."
- **Kaa's rental service charge** (`web/src/lib/pricing/service-charge.ts`): a configurable rate,
  10% today, computed from the landlord's rent at read time and shown to the tenant as its own line —
  never folded into the rent, never charged to the landlord.
- Full design system on the Kaa brand, tokens, primitives, status vocabulary, light and dark
- Public marketing site: home, how it works, landlords, field ops, pricing, about, legal
- **Three languages** — Swahili, English, Kinyarwanda — with the choice as a cookie, so it applies to
  every surface and to the WhatsApp assistant without forking the URL space
- **The Kaa app**: animated opening, create-an-account entry, NIDA + phone registration, interactive
  search with filters, locked photo states, the paywall, the assistant, saved homes, account
- **Freemium enforcement**, server-side. Free users get a genuine match count and a thin preview;
  photos, full details, landlord contact, saving and viewings need a membership. Verified by a test
  suite that tries to get past it with direct API calls, forged headers and a tampered cookie
- **The WhatsApp assistant**: signature-checked webhook, natural-language search in three languages,
  conversational refinement, the same paywall, the same database
- Kaa Operators: dashboard with collections trend, properties and property detail, listings and
  approval queue, tenants, leases, rent and payments with arrears, viewings, maintenance, field agent
  network with review queue, settings
- Kaa Field Ops on its own deployment: agent home, five-step guided capture with live GPS accuracy
  gating and recorded landlord consent, submissions and detail with reviewer feedback, earnings
- Postgres schema with RLS across both migrations

Not yet built, and what stands in for it today:

- **Live Supabase queries** behind the tenant catalogue. Reads still resolve against the seed
  dataset, and accounts, memberships and saved homes live in an in-process store — fine for
  development, never for production. `0003_tenant_accounts.sql` is the schema they move onto.
- **A real NIDA integration.** Without credentials the flow runs against a labelled development
  stub; the API says `source: "development"` and the UI says so on screen, so nothing ever passes a
  synthetic identity off as a verification.
- **A real payment provider.** Checkout creates a pending membership and nothing else. Only a signed
  provider webhook can activate one, and Kaa refuses unsigned callbacks, so with no provider
  configured a membership simply never activates.
- **Supabase Auth for the operator and landlord sides.** Role-based route protection on `/operators`
  and `/landlord` is in place today (`web/src/proxy.ts`), backed by the same in-process stores as the
  rest of the seed dataset; moving the officer, landlord and account tables onto Supabase does not
  change that enforcement, only where the records live.
- **Kinyarwanda copy has not been reviewed by a native speaker.** The keys are all present and
  tested; the wording needs a pass before Kigali.

---

## Brand

| Token | Value |
|---|---|
| Primary | `#00C89A` |
| Ink | `#111318` |
| Muted | `#676B73` |
| Surface | `#F2F4F5` |
| Mint | `#E6FBF2` |
| Typeface | Poppins |

The mark is a crab: two claws for protection, an arch for shelter, two dots for the people at the
centre. In Kiswahili *kaa* means both "crab" and "to stay, to settle", the logo holds both readings.

Source of truth: [`brand/Kaa Logo Brand Design.png`](brand/).

> The mark in `web/src/components/brand/logo.tsx` is a **hand-traced SVG
> approximation** of the brand PNG, close, but not the original artwork. It is
> vector so it scales and recolours for dark mode, which a PNG cannot. Drop the
> designer's original SVG or AI export into that component when it is available.
