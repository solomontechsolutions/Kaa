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

Field agents get their own URL. They do not pass through the public site to reach their work, and
the main deployment does not serve Field Ops at all — `kaatz.vercel.app/field` is a 404 there.

It is the same repository deployed a second time, not a second codebase:

1. vercel.com/new, import `solomontechsolutions/Kaa` again as a **new project** named
   `kaafieldops`. The project name is what gives you `kaafieldops.vercel.app`.
2. Root Directory `web`, exactly as before.
3. Add one environment variable that the main project does **not** have:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_KAA_SURFACE` | `fieldops` |

4. Deploy.

`web/src/proxy.ts` reads that variable and routes on it:

| | `kaatz.vercel.app` | `kaafieldops.vercel.app` |
|---|---|---|
| `NEXT_PUBLIC_KAA_SURFACE` | *(unset)* | `fieldops` |
| `/` | Marketing home | The agent's day |
| `/capture` | 404 | Guided listing capture |
| `/field` | **404** | The agent's day |
| `/app`, `/operators` | Served | Rewritten into Field Ops |

Both projects share `web/vercel.json` and the same Supabase credentials. Give the Field Ops project
the Supabase variables and nothing else — it has no reason to hold the NIDA, payments or WhatsApp
secrets, and not giving them to it means a compromise of the agent-facing deployment cannot spend
them.

### Domains

Point `kaa.co.tz` and `www.kaa.co.tz` at the main project under **Settings → Domains**, and
`field.kaa.co.tz` at the `kaafieldops` project. Kaa Operators stays a path on the main deployment
(`/operators`); when you want it on `app.kaa.co.tz`, add the domain and rewrite it to that path —
the route structure was built so that move requires no code changes.

---

## 2. Supabase

### Create the project

1. **supabase.com/dashboard** → New project.
2. Region: **`eu-central-1` (Frankfurt)** to sit next to the Vercel region.
3. Save the database password somewhere durable, it is shown once.

### Run the migrations

The schema is four files, applied in order. The simplest route with no CLI installed is the
dashboard SQL editor:

1. **SQL Editor → New query**, paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), run.
   This creates every enum, table, index, trigger, authorization helper and row-level-security policy.
2. New query, paste [`supabase/migrations/0002_storage.sql`](supabase/migrations/0002_storage.sql), run.
   This creates the `property-media` and `submission-media` buckets and their access policies.
3. New query, paste [`supabase/migrations/0003_tenant_accounts.sql`](supabase/migrations/0003_tenant_accounts.sql), run.
   This adds the tenant side: NIDA-verified accounts, the TZS 10,000 membership, saved properties and
   WhatsApp conversation linking. See the notes below before you take money.
4. New query, paste [`supabase/seed.sql`](supabase/seed.sql), run. This loads the reference data:
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

### What 0003 guarantees

Two things in the tenant migration are worth knowing before you take money:

- **`tenant_subscriptions` has a unique index allowing one active membership per tenant.** Buying
  twice is prevented rather than reconciled afterwards.
- **No tenant-session policy grants insert or update on `tenant_subscriptions`.** Membership is
  written by the service role from the payment webhook and by nothing else, so a tenant with a valid
  session and a REST client still cannot make themselves a member.

---

## 3. The services behind the tenant experience

The app runs without any of these; each one degrades in a way that says so rather than pretending.
Set them under **Project → Settings → Environment Variables** on the **main** deployment only.

### Tenant sessions

| Variable | Notes |
|---|---|
| `KAA_SESSION_SECRET` | `openssl rand -base64 48`. **Required in production** — the app throws on boot without it, rather than signing sessions with a value published in this repository. |

### NIDA

| Variable | Notes |
|---|---|
| `NIDA_API_BASE_URL`, `NIDA_API_KEY` | From the NIDA integration agreement |
| `NIDA_HASH_SALT` | `openssl rand -base64 32`. Salts the one-way hash that is the only form of a NIN Kaa stores. Set it **before** the first real registration — changing it later orphans every existing hash. |

Only the fields the data-sharing agreement covers are read from a NIDA response; anything else it
returns is dropped rather than stored. The NIN is never written in the clear, never returned to a
client, and never shown to a landlord.

With these blank, registration runs against a labelled development stub. The API response carries
`source: "development"` and the sign-up screen says so on screen, so a staging deployment can never
be mistaken for one doing real verification.

### Mobile money

| Variable | Notes |
|---|---|
| `PAYMENTS_PROVIDER`, `PAYMENTS_API_BASE_URL`, `PAYMENTS_API_KEY` | Selcom or Azampay; both aggregate M-Pesa, Tigo Pesa, Airtel Money and Halopesa |
| `PAYMENTS_WEBHOOK_SECRET` | HMAC-SHA256 shared secret |

Point the provider's callback at `https://kaatz.vercel.app/api/payments/webhook`.

**This webhook is the only thing that activates a membership.** Kaa refuses an unsigned callback
outright rather than trusting it, so `PAYMENTS_WEBHOOK_SECRET` is not optional once real money is
moving — without it every callback is rejected and no membership will ever activate.

### SMS

| Variable | Notes |
|---|---|
| `SMS_PROVIDER`, `SMS_API_BASE_URL`, `SMS_API_KEY` | Phone confirmation codes |

Without a provider the code is written to the server log so the flow can be exercised. It is never
put in an HTTP response.

### WhatsApp Business Platform

| Variable | Notes |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Meta → WhatsApp → API setup |
| `WHATSAPP_ACCESS_TOKEN` | A permanent system-user token, not the 24-hour test token |
| `WHATSAPP_VERIFY_TOKEN` | Any string you choose; you type the same one into Meta |
| `WHATSAPP_APP_SECRET` | Meta → App settings → Basic |

In Meta's app, set the webhook callback URL to
`https://kaatz.vercel.app/api/whatsapp/webhook`, paste the same verify token, and subscribe to the
`messages` field. The GET handshake answers Meta's challenge; the POST handler checks the
`X-Hub-Signature-256` header on every delivery.

**`WHATSAPP_APP_SECRET` is not optional.** A linked WhatsApp number identifies a Kaa account, so an
unverified webhook would let anyone impersonate any tenant — and read whatever that tenant's
membership entitles them to. Kaa refuses unsigned deliveries.

Also set `NEXT_PUBLIC_APP_URL` to the production URL, so the unlock links the assistant sends point
somewhere real.

---

## 4. Connect Vercel and Supabase

### Connect the two

Copy the Project URL and the anon key from **Project Settings → API** into the Vercel environment
variables above, then redeploy. The app switches from the seed dataset to live Supabase for anything
that has been migrated over. Today that is the waitlist endpoint; the read model in
`web/src/lib/data/queries.ts` is the next piece to move.

---

## Before this is a real production system

Worth being explicit, because the deploy will look finished before it is:

- **The operator and agent portals have no authentication yet.** `/operators`, and Field Ops on its
  own deployment, are open to anyone with the URL. Both are marked `noindex` so they will not turn
  up in search, but that is obscurity, not access control. Treat them as a demo until Supabase auth
  and route protection land.

  The **tenant** side is different: sessions are signed, and every protected operation is checked
  server-side against the subscription rows. `npm --prefix web test` includes a suite that tries to
  get past it with direct API calls, forged headers and a tampered cookie.
- **The portals show seeded data**, not your real portfolio. The properties, tenants, agents and
  payments are fictional Dar es Salaam examples.
- **Tenant accounts, memberships and saved homes live in an in-process store** until the reads move
  to Supabase. That store is per-instance and resets on deploy. Do not sell memberships against it.
- **Most write paths do not persist yet.** Capture, settings and the approval actions render and
  check their inputs but do not write. The waitlist endpoint is the exception; it writes for real
  once Supabase is connected.
- **`docs/` is committed to the repository**, including the business plan and investor material. If
  the GitHub repository is public, so are those. Make the repository private, or move `docs/` out.
