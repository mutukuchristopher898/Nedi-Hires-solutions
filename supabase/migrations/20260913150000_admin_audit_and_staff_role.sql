-- Admin audit log and a staff role.
--
-- Both go in before the admin CRUD work rather than after it: every one of
-- those screens writes to the audit log, and retrofitting it would mean
-- touching all of them twice.

-- ─────────────────────────────────────────────────────────────
-- 1. The staff role
--
-- Added *below* the existing admin rather than renaming anything. is_admin()
-- keeps exactly its current meaning, so the dozen policies already built on it
-- do not change behaviour, and a new is_staff() covers both roles. The
-- alternative — promoting admin to super_admin and re-pointing every policy —
-- is a lot of moving parts for no gain.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'partner', 'staff', 'admin'));

create or replace function public.is_staff()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

grant execute on function public.is_staff() to authenticated;

-- The split, as the owner specified it:
--   staff  — day to day: approvals, replies, document review, hiding vehicles
--   admin  — all of that, plus accounts, platform pricing and deletions
--
-- Only the policies covering staff work are widened. Anything touching money
-- policy or account lifecycle stays is_admin().

drop policy if exists "Admins can view all vehicles" on public.vehicles;
create policy "Staff can view all vehicles" on public.vehicles
  for select using (is_staff());

drop policy if exists "Admins can update all vehicles" on public.vehicles;
create policy "Staff can update all vehicles" on public.vehicles
  for update using (is_staff()) with check (is_staff());

drop policy if exists "Admins can update all documents" on public.identity_documents;
create policy "Staff can update all documents" on public.identity_documents
  for update using (is_staff()) with check (is_staff());

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Staff can read contact messages" on public.contact_messages
  for select using (is_staff());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Staff can update contact messages" on public.contact_messages
  for update using (is_staff()) with check (is_staff());

drop policy if exists "Admins can view all quote requests" on public.quote_requests;
create policy "Staff can view all quote requests" on public.quote_requests
  for select using (is_staff());

drop policy if exists "Admins can update all quote requests" on public.quote_requests;
create policy "Staff can update all quote requests" on public.quote_requests
  for update using (is_staff()) with check (is_staff());

drop policy if exists "Admins can view all bookings" on public.bookings;
create policy "Staff can view all bookings" on public.bookings
  for select using (is_staff());

drop policy if exists "Admins can view all partners" on public.partners;
create policy "Staff can view all partners" on public.partners
  for select using (is_staff());

-- Reading people's profiles is part of day-to-day support; changing them is
-- not. Update stays admin-only, which is what governs suspension and deletion.
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Staff can view all profiles" on public.profiles
  for select using (is_staff());

-- Deliberately unchanged, still is_admin():
--   "Admins can update all bookings"      — cancelling releases a held vehicle
--   "Admins can update all profiles"      — suspension, role changes
--   "Admins can update all partners"
--   pricing_settings / one_way_fees       — platform money policy
--   prevent_self_approval, prevent_partner_pricing_override

-- ─────────────────────────────────────────────────────────────
-- 2. The audit log
-- ─────────────────────────────────────────────────────────────

create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  -- Denormalised on purpose: the actor's profile may later be anonymised or
  -- deleted, and an audit trail that forgets who acted is not an audit trail.
  actor_email  text,
  actor_role   text,
  action       text not null,          -- 'update' | 'insert' | 'delete'
  entity_type  text not null,          -- table name
  entity_id    text,
  -- Only the columns that actually changed, so a row is readable rather than
  -- two hundred lines of unchanged fields.
  changes      jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id, created_at desc);
create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- Readable by staff, writable by nobody through the API. Entries are written
-- only by the trigger below, which runs as the definer — so an admin cannot
-- edit or delete their own trail, which is the entire point of having one.
create policy "Staff can read the audit log" on public.admin_audit_log
  for select using (is_staff());

-- ─────────────────────────────────────────────────────────────
-- 3. Recording, by trigger rather than by remembering
--
-- Triggers rather than explicit calls from the application: a call that has to
-- be added to every handler is a call that will eventually be forgotten, and a
-- gap in an audit log is worse than no audit log because it looks complete.
-- ─────────────────────────────────────────────────────────────

create or replace function public.record_admin_change()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_actor    uuid := auth.uid();
  v_role     text;
  v_email    text;
  v_changes  jsonb := '{}'::jsonb;
  v_before   jsonb;
  v_after    jsonb;
  v_key      text;
  v_entity   text;
begin
  -- Only staff actions are recorded. A customer editing their own profile or
  -- advancing their own booking is ordinary traffic, not an admin action, and
  -- logging it would bury the entries that matter.
  select role, email into v_role, v_email from profiles where id = v_actor;

  if v_role is null or v_role not in ('staff', 'admin') then
    return coalesce(new, old);
  end if;

  v_before := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_after  := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;

  -- Diff to only what moved.
  for v_key in select jsonb_object_keys(v_before) union select jsonb_object_keys(v_after) loop
    if v_before -> v_key is distinct from v_after -> v_key then
      v_changes := v_changes || jsonb_build_object(
        v_key, jsonb_build_object('from', v_before -> v_key, 'to', v_after -> v_key)
      );
    end if;
  end loop;

  -- An UPDATE that changed nothing is noise.
  if tg_op = 'UPDATE' and v_changes = '{}'::jsonb then
    return new;
  end if;

  v_entity := tg_table_name;

  insert into admin_audit_log (actor_id, actor_email, actor_role, action, entity_type, entity_id, changes)
  values (
    v_actor,
    v_email,
    v_role,
    lower(tg_op),
    v_entity,
    coalesce((v_after ->> 'id'), (v_before ->> 'id')),
    v_changes
  );

  return coalesce(new, old);
end;
$fn$;

-- Applied to everything an admin can act on. AFTER, so a change that fails
-- for any other reason leaves no entry claiming it happened.
do $$
declare
  t text;
begin
  foreach t in array array[
    'vehicles', 'profiles', 'bookings', 'partners',
    'identity_documents', 'contact_messages', 'quote_requests',
    'pricing_settings', 'one_way_fees'
  ] loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$s', t);
    execute format(
      'create trigger trg_audit_%1$s after insert or update or delete on public.%1$s
         for each row execute function public.record_admin_change()', t);
  end loop;
end;
$$;
