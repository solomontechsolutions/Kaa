-- ═══════════════════════════════════════════════════════════════════════
--  Kaa — tenant accounts, NIDA verification, membership, saved properties
--
--  Adds the tenant side of the platform to the schema in 0001_init.sql:
--
--    • NIDA verification as a first-class, separate thing from membership
--    • the TZS 10,000 / year tenant subscription, with the state machine that
--      only a confirmed payment can advance
--    • saved properties, enforced in the database rather than the browser
--    • WhatsApp conversation linking, so one number is one Kaa account
--
--  The existing `subscriptions` table stays for compatibility; the new
--  `tenant_subscriptions` is the one the service reads, because a membership
--  needs a status, a payment reference and idempotent confirmation, none of
--  which the original three columns can express.
-- ═══════════════════════════════════════════════════════════════════════

create type subscription_state as enum ('pending', 'active', 'expired', 'failed');

-- ───────────────────────────────────────────────────────────────────────
--  Tenant accounts
--
--  Kept apart from `profiles` because a Kaa tenant account is created by the
--  NIDA + OTP flow rather than by Supabase Auth, and because the NIDA number
--  must never be storable in the clear anywhere a profile is read.
-- ───────────────────────────────────────────────────────────────────────

create table tenant_accounts (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid unique references profiles(id) on delete set null,

  -- Salted hash of the 20-digit NIN. The number itself is never stored.
  -- Uniqueness here is what enforces one identity to one Kaa membership.
  nida_hash          text unique,
  nida_last4         text check (nida_last4 ~ '^[0-9]{4}$'),
  nida_status        verification_status not null default 'unverified',
  nida_verified_at   timestamptz,

  -- Identity fields Kaa is approved to retain under the NIDA data-sharing
  -- agreement. Nothing beyond these is mapped from a NIDA response.
  full_name          text,
  date_of_birth      date,
  sex                text,
  nationality        text,

  phone              text unique,                 -- E.164, +255…
  phone_verified_at  timestamptz,

  -- The WhatsApp number this account answers on. Usually the same as `phone`.
  whatsapp_phone     text unique,

  preferred_language text not null default 'sw' check (preferred_language in ('sw', 'en', 'rw')),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column tenant_accounts.nida_hash is
  'HMAC-SHA256 of the NIN under NIDA_HASH_SALT. Present so duplicates can be detected without the platform ever holding the number.';

comment on column tenant_accounts.preferred_language is
  'Swahili default. Kinyarwanda is here because Kigali is the next market and the copy layer already carries it.';

create index tenant_accounts_phone_idx    on tenant_accounts(phone);
create index tenant_accounts_whatsapp_idx on tenant_accounts(whatsapp_phone);

-- ───────────────────────────────────────────────────────────────────────
--  Membership — TZS 10,000 for 12 months
--
--  One row per purchase attempt. `pending` is created when checkout starts;
--  only the payment provider's signed webhook may move it to `active`.
-- ───────────────────────────────────────────────────────────────────────

create table tenant_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references tenant_accounts(id) on delete cascade,
  plan               text not null default 'tenant_annual',
  amount             bigint not null default 10000,       -- TZS, whole shillings
  status             subscription_state not null default 'pending',
  starts_at          timestamptz,
  ends_at            timestamptz,

  -- Kaa's own reference, sent to the provider and returned on the callback.
  -- Unique, so a retried webhook cannot buy a second year.
  payment_reference  text not null unique,
  provider_reference text,
  payment_id         uuid references payments(id) on delete set null,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- An active membership without a term is not a membership.
  constraint active_has_term check (status <> 'active' or (starts_at is not null and ends_at is not null))
);

create index tenant_subscriptions_account_idx on tenant_subscriptions(account_id, status, ends_at desc);

-- At most one live membership per tenant. Buying twice extends nothing; it is
-- prevented rather than reconciled later.
create unique index tenant_subscriptions_one_active
  on tenant_subscriptions(account_id)
  where status = 'active';

-- ───────────────────────────────────────────────────────────────────────
--  Saved properties
--
--  In the database on purpose. A saved list that lived in local storage would
--  be a way to keep an unlimited set of homes without a membership.
-- ───────────────────────────────────────────────────────────────────────

create table saved_properties (
  account_id uuid not null references tenant_accounts(id) on delete cascade,
  unit_id    uuid not null references units(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (account_id, unit_id)
);

create index saved_properties_account_idx on saved_properties(account_id, saved_at desc);

-- ───────────────────────────────────────────────────────────────────────
--  WhatsApp conversation state
--
--  Only what the next turn needs to make sense — the current search, the last
--  result set, the home being discussed. No transcript is kept.
-- ───────────────────────────────────────────────────────────────────────

create table whatsapp_conversations (
  phone            text primary key,                       -- E.164
  account_id       uuid references tenant_accounts(id) on delete set null,
  state            text not null default 'IDLE',
  criteria         jsonb not null default '{}'::jsonb,
  last_results     uuid[] not null default '{}',
  shown_up_to      int not null default 0,
  focused_unit_id  uuid references units(id) on delete set null,
  updated_at       timestamptz not null default now()
);

create index whatsapp_conversations_account_idx on whatsapp_conversations(account_id);

-- ───────────────────────────────────────────────────────────────────────
--  Phone verification challenges
--
--  Codes are stored hashed with an expiry and an attempt count, so a leaked
--  table does not hand anyone a working code.
-- ───────────────────────────────────────────────────────────────────────

create table phone_challenges (
  phone      text primary key,
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  sends      int not null default 1,
  window_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────
--  updated_at triggers
-- ───────────────────────────────────────────────────────────────────────

create trigger set_updated_at before update on tenant_accounts
  for each row execute function set_updated_at();
create trigger set_updated_at before update on tenant_subscriptions
  for each row execute function set_updated_at();

-- ───────────────────────────────────────────────────────────────────────
--  Row level security
--
--  Default deny, as everywhere else in this schema. Note what tenants may NOT
--  write: nothing here lets a tenant insert or update their own subscription.
--  Membership is granted by the service role from the payment webhook and by
--  nothing else, so a tenant with a valid session and a REST client still
--  cannot make themselves a member.
-- ───────────────────────────────────────────────────────────────────────

alter table tenant_accounts        enable row level security;
alter table tenant_subscriptions   enable row level security;
alter table saved_properties       enable row level security;
alter table whatsapp_conversations enable row level security;
alter table phone_challenges       enable row level security;

-- A tenant reads and edits their own account, and may change only preferences.
-- Verification columns are not writable from a tenant session; they are set by
-- the server after NIDA and OTP have actually answered.
create policy "own tenant account readable" on tenant_accounts
  for select using (profile_id = auth.uid() or auth_is_platform_admin());

create policy "admin manages tenant accounts" on tenant_accounts
  for all using (auth_is_platform_admin());

create policy "own subscription readable" on tenant_subscriptions
  for select using (
    account_id in (select id from tenant_accounts where profile_id = auth.uid())
    or auth_is_platform_admin()
  );

create policy "admin manages subscriptions" on tenant_subscriptions
  for all using (auth_is_platform_admin());

-- Saving is a member benefit, and the check lives here as well as in the API.
-- A tenant with a session but no active membership cannot insert a row even by
-- calling PostgREST directly.
create policy "member manages own saves" on saved_properties
  for all using (
    account_id in (select id from tenant_accounts where profile_id = auth.uid())
    and exists (
      select 1 from tenant_subscriptions s
      where s.account_id = saved_properties.account_id
        and s.status = 'active'
        and s.ends_at > now()
    )
  )
  with check (
    account_id in (select id from tenant_accounts where profile_id = auth.uid())
    and exists (
      select 1 from tenant_subscriptions s
      where s.account_id = saved_properties.account_id
        and s.status = 'active'
        and s.ends_at > now()
    )
  );

-- Conversation state and OTP challenges are server-side only. No tenant
-- session has any reason to read either, and a policy-free RLS table denies
-- everything that is not the service role.
create policy "admin reads conversations" on whatsapp_conversations
  for all using (auth_is_platform_admin());
