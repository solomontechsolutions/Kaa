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
| **Kaa Operators** | `kaatz.vercel.app` | `/operators` | Landlords enrolled by FieldOps, property managers, platform admin |
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
person. Kaa creates the landlord's account from that submission and sends them the login. The
property then appears in the Kaa app and in the WhatsApp assistant at the same moment, from the same
database.

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
│   ├── src/app/operators/      Kaa Operators portal
│   ├── src/app/field/          Kaa Field Ops portal (its own deployment)
│   ├── src/app/api/            Route handlers, incl. the WhatsApp webhook
│   ├── src/components/         Design system, brand, shell, surface components
│   └── src/lib/
│       ├── access/             Entitlements and the redaction boundary
│       ├── accounts/           NIDA, phone OTP, sessions, account store
│       ├── data/               Seed dataset, org read model, tenant catalogue
│       ├── i18n/               Swahili, English, Kinyarwanda
│       ├── fieldops/           Submissions, workflow, permissions, offline queue
│       ├── search/             Criteria parsing and the ranked search service
│       ├── subscription/       Membership state machine
│       └── whatsapp/           Transport, conversation manager, phrasebook
│   └── tests/                  Vitest: access, paywall bypass, WhatsApp, i18n
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

| Stream | Detail |
|---|---|
| Tenant membership | TZS 10,000 per year, the only thing a tenant pays Kaa |
| Facilitation fee | Up to 5% of first-year rent, charged to the landlord once, only on a tenancy Kaa sourced |
| Premium listings | Enhanced placement for landlords (planned) |
| Value-added services | Tenant screening, document verification, rental insurance (planned) |

---

## Status

Built and working:

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
- **Supabase Auth for the operator side** and role-based route protection on `/operators`.
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
