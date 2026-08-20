# Kaa

**Stay. Settle. Belong.**

Kaa is Tanzania's rental platform. It connects people to verified rental homes directly from
landlords — removing the informal broker layer that currently charges tenants to view houses that are
often already let, misrepresented, or do not exist.

Roughly half of Dar es Salaam's households rent, and almost all of them find a home the same way: a
phone number, a broker, a fee, and hope. Kaa replaces that with listings that carry proof — a GPS pin
taken on site, photographs from that day, a landlord who confirmed the terms, and the real upfront
cost stated before anyone travels across the city.

---

## Surfaces

Kaa is **mobile first**. Tenant discovery lives in the mobile app. The web build in this repository
serves three surfaces from a single Next.js application:

| Surface | Path | Audience | Purpose |
|---|---|---|---|
| **Website** | `/` | Public | Brand, how verification works, landlord and agent recruitment, waitlist |
| **Kaa Operators** | `/operators` | Landlords, property managers, platform admin | Properties, units, tenants, leases, rent collection, arrears, maintenance, listing approvals, agent network |
| **Kaa Field Ops** | `/field` | Field agents | On-site listing capture with GPS and photos, submission tracking, earnings and payouts |

The two portals are route groups today so everything ships as one deployment. They are structured so
`app.kaa.co.tz` and `field.kaa.co.tz` can be mapped to them later without moving code.

---

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** — Kaa design tokens defined in `web/src/app/globals.css`
- **Supabase** — Postgres + PostGIS, phone-OTP auth, storage, row level security
- **Recharts** for operator analytics · **lucide-react** for iconography
- **Poppins** via `next/font` — the brand typeface

### Running Kaa without Supabase

Supabase credentials are optional. With none configured, every surface resolves against the seed
dataset in `web/src/lib/data/seed.ts` — realistic Dar es Salaam properties, wards, rents, leases,
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
```

```bash
npx --prefix web tsc --noEmit
```

---

## Repository layout

```
├── web/                        Next.js application (all three surfaces)
│   ├── src/app/(site)/         Public marketing site
│   ├── src/app/operators/      Kaa Operators portal
│   ├── src/app/field/          Kaa Field Ops portal
│   ├── src/app/api/            Route handlers
│   ├── src/components/         Design system, brand, shell, surface components
│   └── src/lib/                Types, formatting, data layer, Supabase clients
├── supabase/                   Schema, storage buckets, reference data, CLI config
├── brand/                      Logo and brand board
├── docs/                       Business plan, investor material, market research
└── archive/                    Panga-era prototype, kept for reference only
```

---

## Domain model

The schema lives in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). The
pieces that matter:

- **Geography** — Tanzania's region → district → ward hierarchy. A ward is the unit of an agent's
  zone and of hyperlocal search.
- **Organizations** — the tenancy boundary for Operators. An individual landlord with two units and a
  manager with two hundred both get one.
- **Properties → units → media** — a unit carries `advance_months` alongside rent, because months
  demanded upfront is the number Tanzanian tenants actually get ambushed with.
- **Listing submissions** — the Field Ops → Operators review pipeline, carrying the GPS fix, its
  accuracy, and the capture timestamp as evidence.
- **Agent earnings** — a ledger, not a balance. TZS 2,000 per verified listing and TZS 5,000 per
  rental match, per the FieldOps agreement.
- **Leases, invoices, payments** — mobile money settlement with the provider fee recorded separately
  so it can be shown rather than buried.

Row level security is enabled on every table with a default-deny posture. Reference data is
world-readable, the public sees only `live` listings, org members see their own org, and an agent can
read their own earnings but never write them.

---

## Monetisation

| Stream | Detail |
|---|---|
| Tenant subscription | TZS 10,000 per year — the only thing a tenant pays Kaa |
| Facilitation fee | Up to 5% of first-year rent, charged to the landlord once, only on a tenancy Kaa sourced |
| Premium listings | Enhanced placement for landlords (planned) |
| Value-added services | Tenant screening, document verification, rental insurance (planned) |

---

## Status

Built and working:

- Full design system on the Kaa brand — tokens, primitives, status vocabulary, light and dark
- Public marketing site: home, how it works, landlords, field ops, pricing, about, legal
- Kaa Operators: dashboard with collections trend, properties and property detail, listings and
  approval queue, tenants, leases, rent and payments with arrears, viewings, maintenance, field agent
  network with review queue, settings
- Kaa Field Ops: agent home, five-step guided capture with live GPS accuracy gating, submissions and
  detail with reviewer feedback, earnings ledger, account
- Complete Postgres schema with RLS, and a waitlist API that degrades gracefully without a database

Not yet built:

- Authentication (phone OTP through Supabase) and role-based route protection
- Live Supabase queries behind the data layer, replacing the seed dataset
- Mobile money integration and NIDA verification — both stubbed in `.env.example`
- Write paths: the forms render and validate but do not persist yet
- WhatsApp onboarding funnel; Kiswahili translation layer (copy is English, `sw` is the HTML default)

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
centre. In Kiswahili *kaa* means both "crab" and "to stay, to settle" — the logo holds both readings.

Source of truth: [`brand/Kaa Logo Brand Design.png`](brand/).

> The mark in `web/src/components/brand/logo.tsx` is a **hand-traced SVG
> approximation** of the brand PNG — close, but not the original artwork. It is
> vector so it scales and recolours for dark mode, which a PNG cannot. Drop the
> designer's original SVG or AI export into that component when it is available.
