-- ═══════════════════════════════════════════════════════════════════════
--  Kaa — FieldOps
--
--  FieldOps is a separate operating entity, jointly owned by Kaa and an
--  established dalali. Its employees visit properties on Kaa's behalf and
--  submit what they collect; Kaa reviews and decides what enters its
--  marketplace.
--
--  That boundary is the reason these tables exist apart from `properties`
--  and `units`. A submission is FieldOps' record. A property is Kaa's. The
--  only bridge between them is an approval, and it is one-way.
-- ═══════════════════════════════════════════════════════════════════════

create type submission_state as enum (
  'DRAFT',                -- on the handset, Kaa cannot see it
  'READY_FOR_UPLOAD',     -- on the handset, complete, waiting for a signal
  'UPLOADING',
  'UPLOADED',             -- Kaa's queue
  'UNDER_REVIEW',
  'CORRECTION_REQUIRED',  -- back with the officer, with reasons
  'RESUBMITTED',
  'APPROVED',             -- became a Kaa property
  'REJECTED'
);

create type fieldops_role as enum ('field_officer', 'fieldops_supervisor', 'kaa_operator');

create type photo_room as enum (
  'exterior', 'living_room', 'bedroom', 'kitchen', 'bathroom', 'compound', 'other'
);

-- ───────────────────────────────────────────────────────────────────────
--  People
--
--  Separate from `profiles` and from `field_agents`: a FieldOps employee is
--  on another company's payroll, and a Kaa operator is Kaa staff who appears
--  here only because the review loop spans both entities and someone has to
--  be identifiable on Kaa's side of it.
-- ───────────────────────────────────────────────────────────────────────

create table fieldops_officers (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid unique references profiles(id) on delete set null,
  employee_id   text not null unique,             -- FO-0142
  full_name     text not null,
  phone         text not null,
  role          fieldops_role not null default 'field_officer',
  is_active     boolean not null default true,
  started_at    date not null default current_date,
  last_active_at timestamptz,
  device_id     text,                             -- the PDU in their hand
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column fieldops_officers.device_id is
  'Which handset this officer carries, so a lost device traces to a person.';

create table fieldops_officer_areas (
  officer_id uuid not null references fieldops_officers(id) on delete cascade,
  ward_id    uuid not null references wards(id) on delete cascade,
  primary key (officer_id, ward_id)
);

-- ───────────────────────────────────────────────────────────────────────
--  Submissions
--
--  The collected property lives in `property` as jsonb rather than fifty
--  columns. It is a draft that is legitimately incomplete for most of its
--  life, its shape changes as Kaa asks for new fields, and it is never
--  queried across — Kaa reads one submission at a time to decide on it.
--  On approval the fields are mapped into `units`, which is where the
--  columns and the indexes belong.
-- ───────────────────────────────────────────────────────────────────────

create table fieldops_submissions (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,            -- KA-000241
  status         submission_state not null default 'DRAFT',

  officer_id     uuid not null references fieldops_officers(id) on delete restrict,

  property       jsonb not null default '{}'::jsonb,
  -- Denormalised out of `property` so the queue can filter and sort without
  -- reaching into jsonb on every row.
  ward_id        uuid references wards(id),
  bedrooms       int,
  monthly_rent   bigint,
  location       geography(point, 4326),
  gps_accuracy_m numeric(7,2),

  uploaded_at    timestamptz,
  reviewed_at    timestamptz,
  reviewed_by    uuid references fieldops_officers(id),

  -- Set on approval. This column *is* the bridge between the two entities.
  kaa_unit_id    uuid references units(id) on delete set null,

  submission_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint approved_has_unit check (status <> 'APPROVED' or kaa_unit_id is not null)
);

create index fieldops_submissions_status_idx  on fieldops_submissions(status, updated_at desc);
create index fieldops_submissions_officer_idx on fieldops_submissions(officer_id, updated_at desc);
create index fieldops_submissions_ward_idx    on fieldops_submissions(ward_id);
-- The Kaa review queue: what is open, oldest first.
create index fieldops_submissions_queue_idx
  on fieldops_submissions(uploaded_at)
  where status in ('UPLOADED', 'UNDER_REVIEW', 'RESUBMITTED');

create table fieldops_photos (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references fieldops_submissions(id) on delete cascade,
  room          photo_room not null default 'other',
  storage_path  text not null,
  caption       text,
  captured_at   timestamptz,
  size_bytes    bigint,
  created_at    timestamptz not null default now()
);

create index fieldops_photos_submission_idx on fieldops_photos(submission_id, room);

-- ───────────────────────────────────────────────────────────────────────
--  Corrections
--
--  What a Kaa operator asked for, in their own words. The officer sees this
--  text and nothing else, which is why the service refuses anything shorter
--  than a sentence: a submission sent back without a reason costs a trip
--  across Dar and teaches nobody anything.
-- ───────────────────────────────────────────────────────────────────────

create table fieldops_corrections (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references fieldops_submissions(id) on delete cascade,
  raised_by     uuid not null references fieldops_officers(id),
  raised_at     timestamptz not null default now(),
  message       text not null check (length(trim(message)) >= 10),
  fields        text[] not null default '{}',
  resolved_at   timestamptz
);

create index fieldops_corrections_submission_idx on fieldops_corrections(submission_id, raised_at desc);

-- ───────────────────────────────────────────────────────────────────────
--  Audit trail
--
--  Every action that changes a submission. FieldOps sells Kaa an operational
--  data process, and its worth rests on being able to say who collected
--  what, when, and who accepted it. Append-only: there is no update or
--  delete policy below, deliberately.
-- ───────────────────────────────────────────────────────────────────────

create table fieldops_events (
  id            bigserial primary key,
  submission_id uuid not null references fieldops_submissions(id) on delete cascade,
  at            timestamptz not null default now(),
  actor_id      uuid references fieldops_officers(id) on delete set null,
  actor_name    text not null,                    -- kept even if the officer leaves
  actor_role    fieldops_role not null,
  action        text not null,
  detail        text not null
);

create index fieldops_events_submission_idx on fieldops_events(submission_id, at);
create index fieldops_events_recent_idx     on fieldops_events(at desc);

create table fieldops_assignments (
  id         uuid primary key default gen_random_uuid(),
  officer_id uuid not null references fieldops_officers(id) on delete cascade,
  ward_id    uuid not null references wards(id) on delete cascade,
  target     int not null default 10,
  due_on     date not null,
  note       text,
  created_at timestamptz not null default now()
);

create index fieldops_assignments_officer_idx on fieldops_assignments(officer_id, due_on);

-- ───────────────────────────────────────────────────────────────────────
--  updated_at
-- ───────────────────────────────────────────────────────────────────────

create trigger set_updated_at before update on fieldops_officers
  for each row execute function set_updated_at();
create trigger set_updated_at before update on fieldops_submissions
  for each row execute function set_updated_at();

-- ───────────────────────────────────────────────────────────────────────
--  Row level security
--
--  The rule the whole arrangement rests on: an officer cannot approve their
--  own work. There is no policy below that lets a `field_officer` write
--  `status = 'APPROVED'`, and no policy that lets one read another officer's
--  submissions. Collapse either and the verification Kaa sells to tenants
--  becomes a self-certification.
-- ───────────────────────────────────────────────────────────────────────

alter table fieldops_officers      enable row level security;
alter table fieldops_officer_areas enable row level security;
alter table fieldops_submissions   enable row level security;
alter table fieldops_photos        enable row level security;
alter table fieldops_corrections   enable row level security;
alter table fieldops_events        enable row level security;
alter table fieldops_assignments   enable row level security;

/** The FieldOps record for the signed-in user, if they have one. */
create or replace function fieldops_self()
returns uuid language sql stable security definer set search_path = public as $$
  select id from fieldops_officers where profile_id = auth.uid() and is_active limit 1;
$$;

create or replace function fieldops_role_of()
returns fieldops_role language sql stable security definer set search_path = public as $$
  select role from fieldops_officers where profile_id = auth.uid() and is_active limit 1;
$$;

create policy "officer reads self" on fieldops_officers
  for select using (
    profile_id = auth.uid()
    or fieldops_role_of() in ('fieldops_supervisor', 'kaa_operator')
    or auth_is_platform_admin()
  );

create policy "admin manages officers" on fieldops_officers
  for all using (auth_is_platform_admin());

create policy "areas follow the officer" on fieldops_officer_areas
  for select using (
    officer_id = fieldops_self()
    or fieldops_role_of() in ('fieldops_supervisor', 'kaa_operator')
  );

-- An officer sees their own work. A supervisor sees the operation. A Kaa
-- operator sees everything that has been submitted — and nothing that has
-- not, because an unfinished record on a handset is not a submission.
create policy "read submissions in scope" on fieldops_submissions
  for select using (
    officer_id = fieldops_self()
    or fieldops_role_of() = 'fieldops_supervisor'
    or (fieldops_role_of() = 'kaa_operator'
        and status not in ('DRAFT', 'READY_FOR_UPLOAD', 'UPLOADING'))
    or auth_is_platform_admin()
  );

-- Officers write their own, and only while it is theirs to write. Once it is
-- with Kaa, or decided, the row is closed to them.
create policy "officer writes own draft" on fieldops_submissions
  for update using (
    officer_id = fieldops_self()
    and status in ('DRAFT', 'READY_FOR_UPLOAD', 'UPLOADING', 'CORRECTION_REQUIRED')
  )
  with check (
    officer_id = fieldops_self()
    -- Note what is missing: APPROVED and REJECTED. An officer cannot put
    -- their own work into either state, from here or from anywhere.
    and status in ('DRAFT', 'READY_FOR_UPLOAD', 'UPLOADING', 'UPLOADED', 'RESUBMITTED')
  );

create policy "officer creates own" on fieldops_submissions
  for insert with check (officer_id = fieldops_self() and status = 'DRAFT');

create policy "kaa operator decides" on fieldops_submissions
  for update using (fieldops_role_of() = 'kaa_operator')
  with check (fieldops_role_of() = 'kaa_operator');

create policy "photos follow the submission" on fieldops_photos
  for all using (
    submission_id in (select id from fieldops_submissions)
  );

create policy "corrections readable in scope" on fieldops_corrections
  for select using (submission_id in (select id from fieldops_submissions));

-- Only Kaa raises a correction.
create policy "kaa operator raises corrections" on fieldops_corrections
  for insert with check (fieldops_role_of() = 'kaa_operator');

create policy "events readable in scope" on fieldops_events
  for select using (submission_id in (select id from fieldops_submissions));

-- Append-only. There is no update or delete policy on `fieldops_events`, so
-- the trail cannot be rewritten by anyone holding a session — which is the
-- only property that makes it worth keeping.
create policy "anyone in scope appends events" on fieldops_events
  for insert with check (submission_id in (select id from fieldops_submissions));

create policy "assignments readable" on fieldops_assignments
  for select using (
    officer_id = fieldops_self()
    or fieldops_role_of() in ('fieldops_supervisor', 'kaa_operator')
  );

create policy "supervisor manages assignments" on fieldops_assignments
  for all using (fieldops_role_of() = 'fieldops_supervisor' or auth_is_platform_admin());
