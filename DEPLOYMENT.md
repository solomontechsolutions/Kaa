# Deploying Kaa

Two platforms: **Vercel** hosts the Next.js app, **Supabase** is the database, auth and storage.
They can be set up in either order. The app runs on Vercel today with no Supabase project at all,
resolving against the seed dataset. Connect Supabase when you want real data behind it.

---

## 1. Vercel

### Import the repository

1. Go to **vercel.com/new** and import `solomontechsolutions/Kaa`.
2. **Set Root Directory to `web`.** This is the one setting that matters and the one that is easy to
   miss. The Next.js app lives in `web/`, not at the repository root. Vercel will fail the build
   with "No Next.js version detected" if this is left at `./`.
3. Leave the rest on the detected defaults:

   | Setting | Value |
   |---|---|
   | Framework Preset | Next.js |
   | Build Command | `next build` (default) |
   | Output Directory | `.next` (default) |
   | Install Command | `npm install` (default) |
   | Node.js Version | 22.x |

4. Deploy. No environment variables are required for the first deploy.

`web/vercel.json` already sets the serving region to `fra1` (Frankfurt), the lowest-latency Vercel
region for East Africa, plus baseline security headers and a `Permissions-Policy` that allows
geolocation and camera on same-origin, which Field Ops capture needs.

### Environment variables

Add these under **Project → Settings → Environment Variables** once Supabase exists. Everything is
optional until then.

| Variable | Environments | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Publishable; safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | **Server only.** Never prefix with `NEXT_PUBLIC_` |

The full list, including the payment, SMS and NIDA slots that are stubbed but not yet wired, is in
[`web/.env.example`](web/.env.example).

### The Field Ops deployment

Field agents get their own URL. They do not pass through the public site to reach their work, and the
Field Ops surface is not something you want discoverable from the marketing nav.

It is the same repository deployed a second time, not a second codebase:

1. vercel.com/new, import `solomontechsolutions/Kaa` again as a **new project** named `kaa-fieldops`.
2. Root Directory `web`, exactly as before.
3. Add one environment variable that the main project does **not** have:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_KAA_SURFACE` | `fieldops` |

4. Deploy.

`web/src/proxy.ts` reads that variable. On the Field Ops deployment it rewrites everything to the
`/field` tree, so the agent's day is at the root of `kaa-fieldops.vercel.app` and `/capture` serves
the capture flow. On the main deployment the variable is absent and nothing is rewritten, so
`kaatz.vercel.app` keeps serving all three surfaces as it does now.

Both projects share `web/vercel.json` and the same Supabase credentials.

### Domains

Point `kaa.co.tz` and `www.kaa.co.tz` at the project under **Settings → Domains**. The two portals
are paths on the same deployment (`/operators`, `/field`), so no extra projects are needed. When you
want them on their own subdomains later, add `app.kaa.co.tz` and `field.kaa.co.tz` as domains and
rewrite them to those paths, the route structure was built so that move requires no code changes.

---

## 2. Supabase

### Create the project

1. **supabase.com/dashboard** → New project.
2. Region: **`eu-central-1` (Frankfurt)** to sit next to the Vercel region.
3. Save the database password somewhere durable, it is shown once.

### Run the migrations

The schema is three files, applied in order. The simplest route with no CLI installed is the
dashboard SQL editor:

1. **SQL Editor → New query**, paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), run.
   This creates every enum, table, index, trigger, authorization helper and row-level-security policy.
2. New query, paste [`supabase/migrations/0002_storage.sql`](supabase/migrations/0002_storage.sql), run.
   This creates the `property-media` and `submission-media` buckets and their access policies.
3. New query, paste [`supabase/seed.sql`](supabase/seed.sql), run. This loads the reference data:
   Dar es Salaam's districts and wards with centroids, and the amenity catalogue in English and
   Kiswahili. The app is not usable without it; this is vocabulary, not demo content.

`0001_init.sql` needs the `postgis` extension. Supabase ships it, but if the run fails on the
`create extension` line, enable **PostGIS** first under **Database → Extensions**.

If you do install the Supabase CLI later, the same thing is `supabase link --project-ref <ref>` then
`supabase db push`. [`supabase/config.toml`](supabase/config.toml) is already configured.

### Auth

Kaa signs people in by phone, so under **Authentication → Providers**:

1. Enable **Phone**, and disable **Confirm email** if email is left on for operator staff.
2. Attach an SMS provider. Twilio works everywhere; a Tanzanian aggregator will be cheaper per
   message at volume and is the better choice before launch.
3. Under **Authentication → URL Configuration**, set Site URL to your Vercel production URL and add
   the preview domain to Redirect URLs.

### Connect the two

Copy the Project URL and the anon key from **Project Settings → API** into the Vercel environment
variables above, then redeploy. The app switches from the seed dataset to live Supabase for anything
that has been migrated over. Today that is the waitlist endpoint; the read model in
`web/src/lib/data/queries.ts` is the next piece to move.

---

## Before this is a real production system

Worth being explicit, because the deploy will look finished before it is:

- **There is no authentication yet.** `/operators` and `/field` are open to anyone with the URL. Both
  are marked `noindex` so they will not turn up in search, but that is obscurity, not access control.
  Treat the deployed portals as a demo until Supabase auth and route protection land.
- **The portals show seeded data**, not your real portfolio. The properties, tenants, agents and
  payments are fictional Dar es Salaam examples.
- **Forms validate but do not persist.** Capture, settings and the approval actions render and check
  their inputs; none of them write yet. The waitlist form is the exception. It writes for real once
  Supabase is connected.
- **`docs/` is committed to the repository**, including the business plan and investor material. If
  the GitHub repository is public, so are those. Make the repository private, or move `docs/` out.
