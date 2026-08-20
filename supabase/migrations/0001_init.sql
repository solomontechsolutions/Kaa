-- ═══════════════════════════════════════════════════════════════════════
--  Kaa — initial schema
--  Stay. Settle. Belong.
--
--  Surfaces served by this schema:
--    • Kaa mobile      — tenant discovery, viewing requests, subscriptions
--    • Kaa Operators   — landlords / property managers / platform admin
--    • Kaa Field Ops   — field agents capturing and verifying listings
-- ═══════════════════════════════════════════════════════════════════════

-- Supabase keeps extensions out of `public`; the database search_path already
-- includes `extensions`, so the types and functions below resolve unqualified.
-- `if not exists` short-circuits when Supabase has already enabled one.
create extension if not exists postgis  with schema extensions;
create extension if not exists pg_trgm  with schema extensions;

-- ───────────────────────────────────────────────────────────────────────
--  Enums
-- ───────────────────────────────────────────────────────────────────────

create type app_role as enum (
  'tenant',          -- mobile app user looking for a home
  'landlord',        -- owns property, uses Operators
  'operator_staff',  -- works for a landlord org
  'field_agent',     -- Kaa Field Ops
  'field_supervisor',
  'platform_admin'   -- Kaa staff
);

create type org_type       as enum ('individual_landlord', 'property_manager', 'developer', 'platform');
create type org_member_role as enum ('owner', 'manager', 'staff', 'viewer');

create type property_type  as enum ('apartment_block', 'house', 'standalone_room', 'shared_house', 'commercial', 'land');
create type unit_status    as enum ('draft', 'available', 'reserved', 'occupied', 'maintenance', 'off_market');
create type listing_state  as enum ('unlisted', 'pending_review', 'live', 'rejected', 'expired', 'paused');
create type furnishing     as enum ('unfurnished', 'semi_furnished', 'furnished');

create type verification_status as enum ('unverified', 'pending', 'verified', 'failed', 'expired');

create type submission_status as enum ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected');

create type lease_status   as enum ('draft', 'pending_signature', 'active', 'ending_soon', 'ended', 'terminated');
create type invoice_status as enum ('pending', 'partial', 'paid', 'overdue', 'waived');
create type payment_method as enum ('mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'bank_transfer', 'cash', 'card');
create type payment_status as enum ('initiated', 'pending', 'succeeded', 'failed', 'refunded');

create type viewing_status as enum ('requested', 'scheduled', 'completed', 'no_show', 'cancelled');
create type maintenance_status as enum ('open', 'acknowledged', 'in_progress', 'resolved', 'closed');
create type maintenance_priority as enum ('low', 'normal', 'high', 'urgent');

create type earning_kind   as enum ('listing_verified', 'rental_match', 'bonus', 'adjustment');
create type earning_status as enum ('accrued', 'approved', 'paid', 'reversed');

create type media_kind     as enum ('photo', 'video', 'floorplan', 'document');

-- ───────────────────────────────────────────────────────────────────────
--  Geography — Tanzania administrative hierarchy
--  Wards are the unit of a field agent's zone and of hyperlocal search.
-- ───────────────────────────────────────────────────────────────────────

create table regions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  code       text unique,
  created_at timestamptz not null default now()
);

create table districts (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid not null references regions(id) on delete cascade,
  name       text not null,
  code       text,
  created_at timestamptz not null default now(),
  unique (region_id, name)
);

create table wards (
  id          uuid primary key default gen_random_uuid(),
  district_id uuid not null references districts(id) on delete cascade,
  name        text not null,
  code        text,
  centroid    geography(point, 4326),
  created_at  timestamptz not null default now(),
  unique (district_id, name)
);

create index wards_district_idx on wards(district_id);
create index wards_centroid_idx on wards using gist(centroid);

-- ───────────────────────────────────────────────────────────────────────
--  Identity
-- ───────────────────────────────────────────────────────────────────────

create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text not null,
  phone              text unique,                    -- E.164, +255…
  email              text unique,
  avatar_url         text,
  preferred_language text not null default 'sw' check (preferred_language in ('sw', 'en')),
  nida_number        text unique,
  nida_status        verification_status not null default 'unverified',
  nida_verified_at   timestamptz,
  is_active          boolean not null default true,
  last_seen_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column profiles.preferred_language is 'Swahili is the default — Kaa is a Tanzanian-first product.';

-- A user may hold several roles (a landlord can also be a tenant).
create table user_roles (
  user_id    uuid not null references profiles(id) on delete cascade,
  role       app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references profiles(id),
  primary key (user_id, role)
);

-- ───────────────────────────────────────────────────────────────────────
--  Organizations — the tenant boundary for Kaa Operators
-- ───────────────────────────────────────────────────────────────────────

create table organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  type           org_type not null default 'individual_landlord',
  tin            text,                                -- Tanzania Revenue Authority TIN
  contact_phone  text,
  contact_email  text,
  logo_url       text,
  payout_method  payment_method default 'mpesa',
  payout_account text,
  is_verified    boolean not null default false,
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table organization_members (
  org_id    uuid not null references organizations(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      org_member_role not null default 'staff',
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index organization_members_user_idx on organization_members(user_id);

-- ───────────────────────────────────────────────────────────────────────
--  Field Ops
-- ───────────────────────────────────────────────────────────────────────

create table field_agents (
  id             uuid primary key references profiles(id) on delete cascade,
  agent_code     text not null unique,               -- e.g. KAA-FA-0142
  supervisor_id  uuid references field_agents(id),
  payout_phone   text not null,
  payout_method  payment_method not null default 'mpesa',
  national_id_verified boolean not null default false,
  is_active      boolean not null default true,
  started_at     date not null default current_date,
  created_at     timestamptz not null default now()
);

-- An agent's assigned wards. Hyperlocal saturation beats citywide spread.
create table field_agent_zones (
  agent_id    uuid not null references field_agents(id) on delete cascade,
  ward_id     uuid not null references wards(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (agent_id, ward_id)
);

-- ───────────────────────────────────────────────────────────────────────
--  Properties & units
-- ───────────────────────────────────────────────────────────────────────

create table properties (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  name          text not null,
  type          property_type not null default 'apartment_block',
  ward_id       uuid references wards(id),
  address_line  text,
  landmark      text,                                 -- "karibu na Shoppers Plaza"
  location      geography(point, 4326),
  description   text,
  year_built    int,
  total_units   int not null default 1,
  caretaker_name  text,
  caretaker_phone text,
  is_verified   boolean not null default false,
  verified_at   timestamptz,
  verified_by   uuid references profiles(id),
  sourced_by    uuid references field_agents(id),     -- which agent brought this in
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index properties_org_idx      on properties(org_id);
create index properties_ward_idx     on properties(ward_id);
create index properties_location_idx on properties using gist(location);
create index properties_name_trgm    on properties using gin(name gin_trgm_ops);

create table units (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references properties(id) on delete cascade,
  label          text not null,                       -- "A3", "Ground Floor", "House"
  bedrooms       int  not null default 1,
  bathrooms      int  not null default 1,
  size_sqm       numeric(8,2),
  floor          int,
  furnishing     furnishing not null default 'unfurnished',
  rent_amount    bigint not null,                     -- TZS, whole shillings
  rent_period    text not null default 'month' check (rent_period in ('month', 'quarter', 'year')),
  deposit_months int not null default 1,
  advance_months int not null default 6,              -- TZ norm: 6–12 months upfront
  utilities_note text,
  status         unit_status not null default 'draft',
  listing_state  listing_state not null default 'unlisted',
  available_from date,
  view_count     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (property_id, label)
);

create index units_property_idx on units(property_id);
create index units_status_idx   on units(status);
create index units_listing_idx  on units(listing_state) where listing_state = 'live';
create index units_rent_idx     on units(rent_amount);

comment on column units.advance_months is
  'Months of rent demanded upfront. Surfacing this is a core Kaa trust feature — it is the number tenants are ambushed with.';

create table amenities (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  name_en  text not null,
  name_sw  text not null,
  icon     text,
  category text not null default 'general'
);

create table unit_amenities (
  unit_id    uuid not null references units(id) on delete cascade,
  amenity_id uuid not null references amenities(id) on delete cascade,
  primary key (unit_id, amenity_id)
);

create table media (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid references units(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  kind        media_kind not null default 'photo',
  storage_path text not null,
  caption     text,
  position    int not null default 0,
  is_cover    boolean not null default false,
  -- Provenance: a Kaa listing photo carries where and when it was taken.
  captured_at timestamptz,
  captured_at_location geography(point, 4326),
  uploaded_by uuid references profiles(id),
  created_at  timestamptz not null default now(),
  constraint media_belongs_to_something check (unit_id is not null or property_id is not null)
);

create index media_unit_idx     on media(unit_id, position);
create index media_property_idx on media(property_id, position);

-- ───────────────────────────────────────────────────────────────────────
--  Listing submissions — the Field Ops → Operators review pipeline
-- ───────────────────────────────────────────────────────────────────────

create table listing_submissions (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,                -- KAA-SUB-2026-00184
  agent_id       uuid not null references field_agents(id) on delete restrict,
  property_id    uuid references properties(id) on delete set null,
  ward_id        uuid references wards(id),

  -- Captured in the field before an org exists to attach it to.
  landlord_name  text not null,
  landlord_phone text not null,
  payload        jsonb not null default '{}'::jsonb,  -- property + unit draft
  captured_at    timestamptz not null default now(),
  captured_location geography(point, 4326),
  gps_accuracy_m numeric(6,2),

  status         submission_status not null default 'draft',
  submitted_at   timestamptz,
  reviewed_by    uuid references profiles(id),
  reviewed_at    timestamptz,
  review_notes   text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index listing_submissions_agent_idx  on listing_submissions(agent_id, status);
create index listing_submissions_status_idx on listing_submissions(status, submitted_at desc);

create table submission_media (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references listing_submissions(id) on delete cascade,
  kind          media_kind not null default 'photo',
  storage_path  text not null,
  captured_at   timestamptz,
  captured_location geography(point, 4326),
  position      int not null default 0,
  created_at    timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────
--  Agent earnings ledger
--  Per the FieldOps contract: TZS 2,000 / verified listing,
--  TZS 5,000 / successful rental match, plus performance tiers.
-- ───────────────────────────────────────────────────────────────────────

create table agent_earnings (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references field_agents(id) on delete cascade,
  kind          earning_kind not null,
  amount        bigint not null,                      -- TZS
  status        earning_status not null default 'accrued',
  submission_id uuid references listing_submissions(id) on delete set null,
  lease_id      uuid,                                 -- FK added after leases
  note          text,
  earned_at     timestamptz not null default now(),
  approved_at   timestamptz,
  paid_at       timestamptz,
  payout_ref    text
);

create index agent_earnings_agent_idx on agent_earnings(agent_id, earned_at desc);
create index agent_earnings_status_idx on agent_earnings(status);

-- ───────────────────────────────────────────────────────────────────────
--  Tenancies
-- ───────────────────────────────────────────────────────────────────────

-- A renter known to an operator. May or may not be a Kaa app user.
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  full_name   text not null,
  phone       text not null,
  email       text,
  nida_number text,
  nida_status verification_status not null default 'unverified',
  emergency_contact_name  text,
  emergency_contact_phone text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index tenants_org_idx     on tenants(org_id);
create index tenants_profile_idx on tenants(profile_id);
create index tenants_phone_idx   on tenants(phone);

create table leases (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,                -- KAA-LSE-2026-00311
  unit_id        uuid not null references units(id) on delete restrict,
  tenant_id      uuid not null references tenants(id) on delete restrict,
  org_id         uuid not null references organizations(id) on delete cascade,

  start_date     date not null,
  end_date       date not null,
  rent_amount    bigint not null,
  rent_period    text not null default 'month',
  deposit_amount bigint not null default 0,
  payment_day    int not null default 1 check (payment_day between 1 and 28),

  status         lease_status not null default 'draft',
  signed_at      timestamptz,
  signed_by_tenant   boolean not null default false,
  signed_by_landlord boolean not null default false,
  document_path  text,
  terminated_at  timestamptz,
  termination_reason text,

  -- Attribution: which agent produced this tenancy, for the match bonus.
  matched_by_agent uuid references field_agents(id),
  commission_rate  numeric(5,2) not null default 0,   -- Kaa facilitation %, up to 5

  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint lease_dates_sane check (end_date > start_date)
);

create index leases_org_idx    on leases(org_id, status);
create index leases_unit_idx   on leases(unit_id);
create index leases_tenant_idx on leases(tenant_id);
create index leases_expiry_idx on leases(end_date) where status = 'active';

alter table agent_earnings
  add constraint agent_earnings_lease_fk
  foreign key (lease_id) references leases(id) on delete set null;

create table rent_invoices (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  lease_id     uuid not null references leases(id) on delete cascade,
  org_id       uuid not null references organizations(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  amount_due   bigint not null,
  amount_paid  bigint not null default 0,
  due_date     date not null,
  status       invoice_status not null default 'pending',
  reminder_sent_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index rent_invoices_lease_idx on rent_invoices(lease_id, period_start desc);
create index rent_invoices_due_idx   on rent_invoices(org_id, status, due_date);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,
  invoice_id   uuid references rent_invoices(id) on delete set null,
  org_id       uuid references organizations(id) on delete set null,
  payer_profile_id uuid references profiles(id) on delete set null,
  amount       bigint not null,
  fee_amount   bigint not null default 0,             -- MNO fee, shown transparently
  method       payment_method not null,
  payer_phone  text,
  provider_ref text,                                  -- MNO transaction id
  status       payment_status not null default 'initiated',
  failure_reason text,
  initiated_at timestamptz not null default now(),
  settled_at   timestamptz,
  metadata     jsonb not null default '{}'::jsonb
);

create index payments_invoice_idx on payments(invoice_id);
create index payments_org_idx     on payments(org_id, settled_at desc);

-- ───────────────────────────────────────────────────────────────────────
--  Demand side — viewing requests come from the mobile app,
--  and land in an Operators queue and a Field Ops agent's day.
-- ───────────────────────────────────────────────────────────────────────

create table viewing_requests (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  unit_id       uuid not null references units(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,
  requester_id  uuid references profiles(id) on delete set null,
  requester_name  text not null,
  requester_phone text not null,
  preferred_at  timestamptz,
  scheduled_at  timestamptz,
  assigned_agent_id uuid references field_agents(id) on delete set null,
  status        viewing_status not null default 'requested',
  outcome_note  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index viewing_requests_org_idx   on viewing_requests(org_id, status);
create index viewing_requests_agent_idx on viewing_requests(assigned_agent_id, scheduled_at);

create table maintenance_requests (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null unique,
  unit_id     uuid not null references units(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  lease_id    uuid references leases(id) on delete set null,
  raised_by   uuid references profiles(id) on delete set null,
  title       text not null,
  description text,
  priority    maintenance_priority not null default 'normal',
  status      maintenance_status not null default 'open',
  assigned_to text,
  cost        bigint,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index maintenance_org_idx on maintenance_requests(org_id, status, priority);

-- ───────────────────────────────────────────────────────────────────────
--  Monetisation & growth
-- ───────────────────────────────────────────────────────────────────────

create table subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  plan       text not null default 'tenant_annual',
  amount     bigint not null default 10000,           -- TZS 10,000 / year
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  payment_id uuid references payments(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index subscriptions_profile_idx on subscriptions(profile_id, is_active);

create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  phone      text,
  email      text,
  role       text not null default 'tenant' check (role in ('tenant', 'landlord', 'agent', 'partner')),
  city       text,
  units_owned int,
  message    text,
  source     text,
  created_at timestamptz not null default now()
);

create unique index waitlist_phone_idx on waitlist(phone) where phone is not null;
create unique index waitlist_email_idx on waitlist(email) where email is not null;

-- ───────────────────────────────────────────────────────────────────────
--  Platform plumbing
-- ───────────────────────────────────────────────────────────────────────

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text,
  kind       text not null default 'info',
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, read_at, created_at desc);

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id) on delete set null,
  org_id      uuid references organizations(id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log(entity_type, entity_id, created_at desc);
create index audit_log_org_idx    on audit_log(org_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────────
--  updated_at triggers
-- ───────────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'properties', 'units', 'listing_submissions',
    'tenants', 'leases', 'rent_invoices', 'viewing_requests', 'maintenance_requests'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────
--  Authorization helpers
--  security definer so RLS policies can call them without recursing.
-- ───────────────────────────────────────────────────────────────────────

create or replace function auth_has_role(target app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = target
  );
$$;

create or replace function auth_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth_has_role('platform_admin');
$$;

create or replace function auth_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from organization_members where user_id = auth.uid();
$$;

create or replace function auth_in_org(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where user_id = auth.uid() and org_id = target
  ) or auth_is_platform_admin();
$$;

-- ───────────────────────────────────────────────────────────────────────
--  Row Level Security
--  Default posture: deny. Every surface reads through an explicit policy.
-- ───────────────────────────────────────────────────────────────────────

alter table profiles             enable row level security;
alter table user_roles           enable row level security;
alter table organizations        enable row level security;
alter table organization_members enable row level security;
alter table field_agents         enable row level security;
alter table field_agent_zones    enable row level security;
alter table properties           enable row level security;
alter table units                enable row level security;
alter table media                enable row level security;
alter table unit_amenities       enable row level security;
alter table listing_submissions  enable row level security;
alter table submission_media     enable row level security;
alter table agent_earnings       enable row level security;
alter table tenants              enable row level security;
alter table leases               enable row level security;
alter table rent_invoices        enable row level security;
alter table payments             enable row level security;
alter table viewing_requests     enable row level security;
alter table maintenance_requests enable row level security;
alter table subscriptions        enable row level security;
alter table notifications        enable row level security;
alter table waitlist             enable row level security;
alter table audit_log            enable row level security;

-- Reference data is world-readable.
alter table regions   enable row level security;
alter table districts enable row level security;
alter table wards     enable row level security;
alter table amenities enable row level security;

create policy "reference readable" on regions   for select using (true);
create policy "reference readable" on districts for select using (true);
create policy "reference readable" on wards     for select using (true);
create policy "reference readable" on amenities for select using (true);

-- Profiles: you see and edit yourself; admins see everyone.
create policy "own profile readable"  on profiles for select using (id = auth.uid() or auth_is_platform_admin());
create policy "own profile writable"  on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin manages profiles" on profiles for all using (auth_is_platform_admin());

create policy "own roles readable" on user_roles for select using (user_id = auth.uid() or auth_is_platform_admin());
create policy "admin manages roles" on user_roles for all using (auth_is_platform_admin());

-- Organizations: members read, owners/managers write, admins do anything.
create policy "members read org" on organizations
  for select using (id in (select auth_org_ids()) or auth_is_platform_admin());
create policy "owners write org" on organizations
  for update using (exists (
    select 1 from organization_members m
    where m.org_id = organizations.id and m.user_id = auth.uid() and m.role in ('owner', 'manager')
  ) or auth_is_platform_admin());
create policy "admin manages orgs" on organizations for all using (auth_is_platform_admin());

create policy "members read membership" on organization_members
  for select using (user_id = auth.uid() or auth_in_org(org_id));
create policy "owners manage membership" on organization_members
  for all using (exists (
    select 1 from organization_members m
    where m.org_id = organization_members.org_id and m.user_id = auth.uid() and m.role = 'owner'
  ) or auth_is_platform_admin());

-- Field agents read their own record; supervisors and admins read the network.
create policy "agent reads self" on field_agents
  for select using (id = auth.uid() or auth_has_role('field_supervisor') or auth_is_platform_admin());
create policy "admin manages agents" on field_agents for all using (auth_is_platform_admin());

create policy "agent reads own zones" on field_agent_zones
  for select using (agent_id = auth.uid() or auth_has_role('field_supervisor') or auth_is_platform_admin());
create policy "admin manages zones" on field_agent_zones for all using (auth_is_platform_admin());

-- Properties & units: org members manage; the public sees only live listings.
create policy "org manages properties" on properties for all using (auth_in_org(org_id));
create policy "public reads listed properties" on properties
  for select using (exists (
    select 1 from units u where u.property_id = properties.id and u.listing_state = 'live'
  ));

create policy "org manages units" on units
  for all using (auth_in_org((select p.org_id from properties p where p.id = units.property_id)));
create policy "public reads live units" on units
  for select using (listing_state = 'live');

create policy "org manages media" on media
  for all using (
    auth_in_org((
      select p.org_id from properties p
      where p.id = coalesce(media.property_id, (select u.property_id from units u where u.id = media.unit_id))
    ))
  );
create policy "public reads live media" on media
  for select using (
    exists (select 1 from units u where u.id = media.unit_id and u.listing_state = 'live')
    or exists (
      select 1 from units u
      where u.property_id = media.property_id and u.listing_state = 'live'
    )
  );

create policy "org manages unit amenities" on unit_amenities
  for all using (auth_in_org((
    select p.org_id from properties p join units u on u.property_id = p.id where u.id = unit_amenities.unit_id
  )));
create policy "public reads unit amenities" on unit_amenities
  for select using (exists (
    select 1 from units u where u.id = unit_amenities.unit_id and u.listing_state = 'live'
  ));

-- Submissions: an agent sees only their own; reviewers see all.
create policy "agent manages own submissions" on listing_submissions
  for all using (agent_id = auth.uid());
create policy "reviewers read submissions" on listing_submissions
  for select using (auth_has_role('field_supervisor') or auth_is_platform_admin());
create policy "reviewers update submissions" on listing_submissions
  for update using (auth_has_role('field_supervisor') or auth_is_platform_admin());

create policy "agent manages own submission media" on submission_media
  for all using ((select s.agent_id from listing_submissions s where s.id = submission_media.submission_id) = auth.uid());
create policy "reviewers read submission media" on submission_media
  for select using (auth_has_role('field_supervisor') or auth_is_platform_admin());

-- Earnings: an agent reads their own ledger and can never write it.
create policy "agent reads own earnings" on agent_earnings
  for select using (agent_id = auth.uid() or auth_has_role('field_supervisor') or auth_is_platform_admin());
create policy "admin writes earnings" on agent_earnings for all using (auth_is_platform_admin());

-- Org-scoped operational records.
create policy "org manages tenants"     on tenants              for all using (auth_in_org(org_id));
create policy "org manages leases"      on leases               for all using (auth_in_org(org_id));
create policy "org manages invoices"    on rent_invoices        for all using (auth_in_org(org_id));
create policy "org manages payments"    on payments             for all using (auth_in_org(org_id));
create policy "org manages viewings"    on viewing_requests     for all using (auth_in_org(org_id));
create policy "org manages maintenance" on maintenance_requests for all using (auth_in_org(org_id));

-- A tenant reads their own lease, invoices and payments from the mobile app.
create policy "tenant reads own lease" on leases
  for select using (tenant_id in (select t.id from tenants t where t.profile_id = auth.uid()));
create policy "tenant reads own invoices" on rent_invoices
  for select using (lease_id in (
    select l.id from leases l join tenants t on t.id = l.tenant_id where t.profile_id = auth.uid()
  ));
create policy "tenant reads own payments" on payments
  for select using (payer_profile_id = auth.uid());

-- An assigned agent sees the viewings on their plate.
create policy "agent reads assigned viewings" on viewing_requests
  for select using (assigned_agent_id = auth.uid());
create policy "agent updates assigned viewings" on viewing_requests
  for update using (assigned_agent_id = auth.uid());

create policy "own subscriptions" on subscriptions
  for all using (profile_id = auth.uid() or auth_is_platform_admin());

create policy "own notifications" on notifications
  for all using (user_id = auth.uid());

-- Waitlist: anyone may join, only admins may read.
create policy "anyone joins waitlist" on waitlist for insert with check (true);
create policy "admin reads waitlist"  on waitlist for select using (auth_is_platform_admin());

create policy "admin reads audit"  on audit_log for select using (auth_is_platform_admin());
create policy "org reads own audit" on audit_log for select using (org_id in (select auth_org_ids()));

-- ───────────────────────────────────────────────────────────────────────
--  New signups get a profile row automatically.
-- ───────────────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Mtumiaji wa Kaa'),
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
