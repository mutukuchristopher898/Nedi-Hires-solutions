-- Vehicle lifecycle: hide, archive, and rejection reasons.
--
-- approval_status alone cannot express what an operator actually needs. A
-- vehicle that is approved but temporarily off the road is not "pending" and
-- is certainly not "rejected", and one that has left the fleet must stop being
-- bookable without taking its past bookings and invoices with it.
--
-- So three independent states rather than one overloaded column:
--   approval_status  has it been reviewed
--   hidden_at        temporarily off the customer site, fully reversible
--   archived_at      gone from the fleet, kept for the records that reference it

alter table public.vehicles
  add column if not exists hidden_at        timestamptz,
  add column if not exists archived_at      timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_at      timestamptz,
  add column if not exists reviewed_by      uuid references public.profiles (id);

create index if not exists vehicles_visible_idx
  on public.vehicles (approval_status)
  where hidden_at is null and archived_at is null;

-- ─────────────────────────────────────────────────────────────
-- Public visibility now means all three things
--
-- The existing policy was approval_status = 'approved' alone, so without this
-- a hidden or archived vehicle would stay bookable — the buttons would work
-- and the customer site would carry on selling it.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Approved vehicles are publicly viewable" on public.vehicles;
create policy "Approved vehicles are publicly viewable" on public.vehicles
  for select using (
    approval_status = 'approved'
    and hidden_at is null
    and archived_at is null
  );

-- ─────────────────────────────────────────────────────────────
-- Archiving is blocked while the vehicle is spoken for
--
-- Not merely a UI confirmation: someone has a booking for this car, and the
-- availability holds from 20260911120000 are what stop it being double-sold.
-- Archiving out from under a live hire has to fail at the database, or a
-- direct PATCH walks straight past whatever the screen says.
-- ─────────────────────────────────────────────────────────────

create or replace function public.prevent_archiving_booked_vehicle()
returns trigger
language plpgsql
security definer set search_path = public   -- counts bookings across customers
as $fn$
declare
  v_ref text;
begin
  if new.archived_at is null or old.archived_at is not null then
    return new;
  end if;

  select b.booking_ref
    into v_ref
  from bookings b
  where b.vehicle_id = new.id
    and b.status <> 'cancelled'
    and b.end_date >= current_date
  order by b.start_date
  limit 1;

  if v_ref is not null then
    raise exception
      'This vehicle has an active or upcoming booking (%). Hide it instead — hiding removes it from search straight away and can be undone.', v_ref
      using errcode = '23514', hint = 'vehicle_has_bookings';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_prevent_archiving_booked_vehicle on public.vehicles;
create trigger trg_prevent_archiving_booked_vehicle
  before update of archived_at on public.vehicles
  for each row execute function public.prevent_archiving_booked_vehicle();

-- ─────────────────────────────────────────────────────────────
-- A rejection has to say why
--
-- The reason is shown to the partner, so "rejected" with no explanation is
-- both useless to them and a support request for you.
-- ─────────────────────────────────────────────────────────────

create or replace function public.require_rejection_reason()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if new.approval_status = 'rejected'
     and coalesce(btrim(new.rejection_reason), '') = '' then
    raise exception 'A rejection needs a reason the partner can act on.'
      using errcode = '23514', hint = 'rejection_reason_required';
  end if;

  -- Clear a stale reason when a previously rejected vehicle is approved.
  if new.approval_status = 'approved' and old.approval_status = 'rejected' then
    new.rejection_reason := null;
  end if;

  -- Stamp who decided, and when, without asking the caller to remember.
  if new.approval_status is distinct from old.approval_status then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_require_rejection_reason on public.vehicles;
create trigger trg_require_rejection_reason
  before update of approval_status on public.vehicles
  for each row execute function public.require_rejection_reason();

-- ─────────────────────────────────────────────────────────────
-- Staff may create a listing on a partner's behalf
--
-- Partners can already insert for their own account. Nothing let an admin do
-- it for them, which the brief asks for — a partner phoning in a car should
-- not require the admin to have their password.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Staff can create vehicles" on public.vehicles;
create policy "Staff can create vehicles" on public.vehicles
  for insert to authenticated
  with check (is_staff());
