-- ═══════════════════════════════════════════════════════════════════════
--  Kaa — storage buckets
--
--  Two buckets, deliberately separated:
--
--    property-media    published listing photos. Public read, because the
--                      mobile app shows them to anyone browsing.
--    submission-media  field capture in progress. Private — a submission is
--                      evidence under review, not published content, and it
--                      carries a landlord's details before they have agreed
--                      to anything.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'property-media',
    'property-media',
    true,
    15728640, -- 15 MB; field agents shoot on phones over mobile data
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4']
  ),
  (
    'submission-media',
    'submission-media',
    false,
    15728640,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4']
  )
on conflict (id) do nothing;

-- ── property-media ─────────────────────────────────────────────────────

create policy "property media is world readable"
  on storage.objects for select
  using (bucket_id = 'property-media');

create policy "org members upload property media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-media'
    -- Path convention: {org_id}/{property_id}/{filename}
    and (storage.foldername(name))[1]::uuid in (select auth_org_ids())
  );

create policy "org members replace property media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1]::uuid in (select auth_org_ids())
  );

create policy "org members delete property media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1]::uuid in (select auth_org_ids())
  );

-- ── submission-media ───────────────────────────────────────────────────
--  Path convention: {agent_id}/{submission_id}/{filename}

create policy "agent reads own submission media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submission-media'
    and (
      (storage.foldername(name))[1]::uuid = auth.uid()
      or auth_has_role('field_supervisor')
      or auth_is_platform_admin()
    )
  );

create policy "agent uploads own submission media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submission-media'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "agent deletes own submission media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submission-media'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );
