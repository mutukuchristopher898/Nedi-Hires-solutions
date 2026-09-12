-- Phase 1 of making the marketplace real: everything the supply side needs
-- before partner onboarding, the partner dashboard and the admin approval
-- queue can stop being mockups.
--
-- The existing RLS was already built for this and is not changed here:
-- partners insert only under their own account, approved vehicles are
-- publicly readable, admins can gate. What was missing is the machinery
-- around it.

-- ─────────────────────────────────────────────────────────────
-- 1. Vehicle photographs
--
-- Stored as an array on the vehicle rather than a side table: the photos have
-- no life of their own, they are always read with the vehicle, and an array
-- inherits the vehicle's RLS instead of needing a parallel policy set. Same
-- shape as the existing `features text[]`.
-- ─────────────────────────────────────────────────────────────

alter table public.vehicles
  add column if not exists photo_paths text[] not null default '{}';

-- Unlike kyc-documents this bucket is public. Car photographs are marketing
-- material, not personal data, and public URLs let listing pages render
-- without minting a signed URL per image on every search.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  true,
  5242880,   -- 5 MB; these are listing photos, not archival originals
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Write is scoped to a folder named for the uploader, matching the
-- kyc-documents pattern. Read is open because the bucket is public.
drop policy if exists "vehicle_photos_public_select" on storage.objects;
create policy "vehicle_photos_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle_photos_owner_insert" on storage.objects;
create policy "vehicle_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vehicle_photos_owner_delete" on storage.objects;
create policy "vehicle_photos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

-- ─────────────────────────────────────────────────────────────
-- 2. A vehicle cannot go live without a photograph
--
-- Owner's decision, and the only real quality lever over stock the business
-- does not own: a listing with no photograph does not get hired, and a
-- coloured placeholder rectangle reads as a site with nothing on it.
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_vehicle_photo_before_approval()
returns trigger
language plpgsql
set search_path = public   -- no security definer: reads only NEW/OLD
as $fn$
begin
  if new.approval_status = 'approved'
     and (tg_op = 'INSERT' or old.approval_status is distinct from 'approved')
     and coalesce(cardinality(new.photo_paths), 0) = 0 then
    raise exception 'A vehicle needs at least one photograph before it can be approved.'
      using hint = 'vehicle_photo_required';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_enforce_vehicle_photo_before_approval on public.vehicles;
create trigger trg_enforce_vehicle_photo_before_approval
  before insert or update on public.vehicles
  for each row execute function public.enforce_vehicle_photo_before_approval();

-- ─────────────────────────────────────────────────────────────
-- 3. Slugs for partner-submitted vehicles
--
-- Vehicle URLs are slugs, not UUIDs, and until now every slug was written by
-- hand in a seed migration. A partner submitting a car cannot supply one.
-- ─────────────────────────────────────────────────────────────

create or replace function public.generate_vehicle_slug(
  p_make text,
  p_model text,
  p_year int
)
returns text
language plpgsql
volatile
security definer set search_path = public   -- must see every slug, including
                                            -- other partners' pending vehicles,
                                            -- which RLS hides from the caller
as $fn$
declare
  v_base      text;
  v_candidate text;
  v_n         int := 0;
begin
  v_base := regexp_replace(
    lower(coalesce(p_make, '') || '-' || coalesce(p_model, '') || '-' || coalesce(p_year::text, '')),
    '[^a-z0-9]+', '-', 'g'
  );
  v_base := trim(both '-' from v_base);

  if v_base = '' then
    v_base := 'vehicle';
  end if;

  v_candidate := v_base;

  -- Two partners listing the same model is the normal case, not the edge one.
  loop
    exit when not exists (select 1 from public.vehicles where slug = v_candidate);
    v_n := v_n + 1;
    v_candidate := v_base || '-' || v_n::text;
  end loop;

  return v_candidate;
end;
$fn$;

create or replace function public.set_vehicle_slug()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  -- Only fill a blank. The seeded fleet's hand-written slugs are in URLs
  -- already and must not move.
  if new.slug is null or trim(new.slug) = '' then
    new.slug := public.generate_vehicle_slug(new.make, new.model, new.year);
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_set_vehicle_slug on public.vehicles;
create trigger trg_set_vehicle_slug
  before insert on public.vehicles
  for each row execute function public.set_vehicle_slug();

-- ─────────────────────────────────────────────────────────────
-- 4. Becoming a partner
--
-- Signing up gives role 'customer', and prevent_role_self_escalation()
-- (20260823093000) blocks anyone but an admin from changing a role — which is
-- exactly right, and is why self-serve partner signup needs an explicit,
-- narrow exception rather than a way around the guard.
--
-- The exception is only customer -> partner, and only for someone who owns a
-- partners row. It grants nothing on its own: partners.status is still
-- 'pending' until an admin approves, vehicle submission is still gated on
-- owning the partner account, and 'admin' remains unreachable.
-- ─────────────────────────────────────────────────────────────

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if new.role is distinct from old.role and not is_admin() then
    -- The one permitted self-service transition.
    if old.role = 'customer'
       and new.role = 'partner'
       and exists (select 1 from public.partners p where p.owner_profile_id = new.id) then
      return new;
    end if;

    raise exception 'Only an admin can change a profile''s role';
  end if;

  return new;
end;
$fn$;

-- Registering a partner account promotes the profile, so the person lands on
-- the partner dashboard instead of being bounced by requireRole(['partner']).
create or replace function public.promote_profile_to_partner()
returns trigger
language plpgsql
security definer set search_path = public   -- writes profiles, which the
                                            -- owner's own policy would allow
                                            -- but which must also work when
                                            -- an admin creates the record
as $fn$
begin
  update public.profiles
  set role = 'partner'
  where id = new.owner_profile_id
    and role = 'customer';   -- never demote an admin

  return new;
end;
$fn$;

drop trigger if exists trg_promote_profile_to_partner on public.partners;
create trigger trg_promote_profile_to_partner
  after insert on public.partners
  for each row execute function public.promote_profile_to_partner();

-- ─────────────────────────────────────────────────────────────
-- 5. Admins need to see and manage partner accounts end to end
-- ─────────────────────────────────────────────────────────────

-- Admins could already view and update partners and vehicles. Deleting a
-- vehicle is what a partner needs to withdraw a listing they no longer own.
drop policy if exists "Partners can delete their own vehicles" on public.vehicles;
create policy "Partners can delete their own vehicles" on public.vehicles
  for delete to authenticated
  using (
    partner_id in (select id from public.partners where owner_profile_id = auth.uid())
  );

-- Partners edit their own listings (price, description, photos) — previously
-- only admins could update a vehicle at all.
drop policy if exists "Partners can update their own vehicles" on public.vehicles;
create policy "Partners can update their own vehicles" on public.vehicles
  for update to authenticated
  using (
    partner_id in (select id from public.partners where owner_profile_id = auth.uid())
  )
  with check (
    partner_id in (select id from public.partners where owner_profile_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 6. A partner must not approve their own vehicle
--
-- Partners can now update their own vehicles, which would otherwise include
-- setting approval_status to 'approved'. That is the admin's decision, and
-- RLS cannot express it because a check expression cannot see OLD.
-- ─────────────────────────────────────────────────────────────

create or replace function public.prevent_self_approval()
returns trigger
language plpgsql            -- no security definer: discriminates on is_admin()
set search_path = public
as $fn$
begin
  if new.approval_status is distinct from old.approval_status and not is_admin() then
    raise exception 'Only an admin can change a vehicle''s approval status';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_prevent_self_approval on public.vehicles;
create trigger trg_prevent_self_approval
  before update on public.vehicles
  for each row
  when (old.approval_status is distinct from new.approval_status)
  execute function public.prevent_self_approval();
