-- ─────────────────────────────────────────────────────────────
-- Retire one-way route fees
--
-- A different drop-off is no longer priced from a table of routes. What it
-- costs to reposition a vehicle depends on the route and on when the car can
-- actually be collected, and a flat per-route figure only guessed at that. The
-- booking wizard now sends the customer to the enquiry form instead, and the
-- route is quoted by hand.
--
-- The app already stopped reading one_way_fees and pricing_settings
-- .default_one_way_fee before this ran, and the wizard already sends
-- dropoff_point equal to pickup_point — which booking_one_way_fee() has always
-- answered with 0 — so new bookings were already priced at zero fee before this
-- migration. Nothing here changes a live quote.
--
-- What is deliberately kept:
--   * bookings.one_way_fee — a booking placed while the fees were live keeps
--     the figure it was quoted. The money trigger's restore branch preserves it
--     on every later update, so those rows are not retropriced.
--   * audit_log entries with entity_type = 'one_way_fees' — dropping the table
--     does not erase the record of who changed a fee, and /admin/audit still
--     filters on it.
-- ─────────────────────────────────────────────────────────────

-- 1. Neutralise the function first, while the table it reads still exists.
--
--    enforce_booking_money() calls this on every booking insert and on every
--    update that touches a pricing input. If the table were dropped first,
--    the function would be left referencing a missing relation and the next
--    booking would fail at runtime rather than at paste time. Order matters.
--
--    Kept as a function rather than removed so that enforce_booking_money()
--    needs no edit, and so a future decision to price one-way hire again has
--    one obvious place to live. Back to `immutable`: it reads no table now.
create or replace function public.booking_one_way_fee(p_pickup text, p_dropoff text)
returns numeric
language sql
immutable
set search_path = public
as $fn$
  -- One-way hire is quoted by hand. Always zero; the arguments are retained
  -- so callers do not have to change.
  select 0::numeric;
$fn$;

comment on function public.booking_one_way_fee(text, text) is
  'Always 0. One-way hire is arranged as a quote rather than priced from a route table.';

-- 2. Now the table is unreferenced and can go, taking its policies and its
--    audit trigger with it.
drop table if exists public.one_way_fees;

-- 3. And the platform-wide default that fed it.
alter table public.pricing_settings drop column if exists default_one_way_fee;
