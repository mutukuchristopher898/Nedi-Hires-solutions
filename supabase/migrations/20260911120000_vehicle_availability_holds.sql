-- Vehicle availability: stop two customers taking the same car on overlapping
-- dates. Closes the availability gap.
--
-- The existing find_overlapping_active_booking() keys on id_number_normalized,
-- so it stops one *person* holding two overlapping bookings. Nothing anywhere
-- looked at vehicle_id, so two different customers could both reach 'confirmed'
-- on the same physical car for the same dates.
--
-- Owner's decision on policy:
--   confirmed            holds the vehicle permanently
--   anything unconfirmed holds it for 30 minutes from created_at
--   cancelled            holds nothing
--
-- Enforced in two layers, because they protect against different things:
--
--   1. An exclusion constraint over confirmed bookings. This is the real
--      guarantee — it is atomic, so two sessions confirming the same car at
--      the same instant cannot both succeed. A trigger cannot promise that:
--      both transactions would run their SELECT before either COMMIT, see no
--      conflict, and both proceed.
--   2. A trigger for the 30-minute grace. This one *cannot* be an exclusion
--      constraint, because the window is relative to now() and a constraint
--      has to be a fixed property of the rows. It is therefore best-effort:
--      it closes the ordinary case, and the constraint above is what makes
--      the outcome that actually matters impossible.

-- ─────────────────────────────────────────────────────────────
-- BEFORE YOU RUN THIS
--
-- The exclusion constraint scans existing rows and will refuse to be created
-- if any two confirmed bookings already overlap. Run this first; it should
-- return zero rows:
--
--   select a.booking_ref, b.booking_ref, a.vehicle_id, a.start_date, a.end_date
--   from bookings a
--   join bookings b
--     on b.vehicle_id = a.vehicle_id
--    and b.id <> a.id
--    and b.start_date <= a.end_date
--    and b.end_date   >= a.start_date
--   where a.status = 'confirmed' and b.status = 'confirmed';
--
-- If it returns anything, those are real conflicts already in the data —
-- cancel one side before applying this.
-- ─────────────────────────────────────────────────────────────

-- Needed to put a uuid equality column alongside a range in one GiST index.
create extension if not exists btree_gist with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Layer 1 — confirmed bookings cannot overlap. Atomic.
-- ─────────────────────────────────────────────────────────────

-- '[]' makes the range inclusive of both endpoints: a car returned on the 5th
-- is not available to collect on the 5th. Turnaround, cleaning and fuel checks
-- are real, and the conservative reading is the one that doesn't strand a
-- customer at the counter.
alter table public.bookings
  drop constraint if exists bookings_confirmed_no_overlap;

alter table public.bookings
  add constraint bookings_confirmed_no_overlap
  exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'confirmed');

-- ─────────────────────────────────────────────────────────────
-- Layer 2 — the 30-minute hold on unconfirmed bookings.
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_vehicle_availability()
returns trigger
language plpgsql
security definer set search_path = public   -- must see other customers' bookings,
                                            -- which RLS hides from the caller
as $fn$
declare
  v_conflict_ref text;
begin
  -- A cancelled booking releases its hold and needs no check of its own.
  if new.status = 'cancelled' then
    return new;
  end if;

  -- On UPDATE, only re-check when something that affects availability moved.
  -- Status is included deliberately: a booking that sat past its 30-minute
  -- grace while someone else confirmed the car must not be able to advance.
  if tg_op = 'UPDATE'
     and new.vehicle_id is not distinct from old.vehicle_id
     and new.start_date is not distinct from old.start_date
     and new.end_date   is not distinct from old.end_date
     and new.status     is not distinct from old.status then
    return new;
  end if;

  select b.booking_ref
    into v_conflict_ref
  from public.bookings b
  where b.vehicle_id = new.vehicle_id
    and b.id <> new.id
    and b.status <> 'cancelled'
    and (
      -- Confirmed holds for good; anything else holds only while it is fresh.
      b.status = 'confirmed'
      or b.created_at > now() - interval '30 minutes'
    )
    -- Standard inclusive overlap: two ranges overlap unless one ends before
    -- the other starts.
    and b.start_date <= new.end_date
    and b.end_date   >= new.start_date
  limit 1;

  if v_conflict_ref is not null then
    -- 23P01 is exclusion_violation, the same SQLSTATE the constraint above
    -- raises, so the app has one case to handle rather than two.
    raise exception 'This vehicle is already booked for those dates.'
      using errcode = '23P01',
            detail  = format('Conflicts with booking %s.', v_conflict_ref),
            hint    = 'vehicle_unavailable';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_enforce_vehicle_availability on public.bookings;
create trigger trg_enforce_vehicle_availability
  before insert or update on public.bookings
  for each row execute function public.enforce_vehicle_availability();

-- ─────────────────────────────────────────────────────────────
-- Read-side helper so the UI can say "just taken" before someone fills in a
-- whole booking form, rather than only finding out on insert.
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_vehicle_available(
  p_vehicle_id uuid,
  p_start date,
  p_end date
)
returns boolean
language sql
security definer set search_path = public   -- same reason as the trigger
stable
as $$
  select not exists (
    select 1
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.status <> 'cancelled'
      and (b.status = 'confirmed' or b.created_at > now() - interval '30 minutes')
      and b.start_date <= p_end
      and b.end_date   >= p_start
  );
$$;

-- Read-only and returns a single boolean about one vehicle and date range, so
-- it leaks nothing about who holds it.
grant execute on function public.is_vehicle_available(uuid, date, date) to anon, authenticated;

-- Makes both the trigger's lookup and the helper an index scan.
create index if not exists bookings_vehicle_dates_idx
  on public.bookings (vehicle_id, start_date, end_date)
  where status <> 'cancelled';
