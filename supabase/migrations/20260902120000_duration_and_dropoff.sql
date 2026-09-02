-- Rental durations (hours/days/weeks/months), pickup/drop-off time, and
-- drop-off location + one-way fee (reservation spec §7). Purely additive —
-- start_date/end_date stay in place, still populated from pickup_at/
-- dropoff_at by the app, so nothing that reads them today needs to change.

alter table bookings
  add column pickup_at timestamptz,
  add column dropoff_at timestamptz,
  add column dropoff_point text,
  add column one_way_fee numeric(10, 2) not null default 0,
  add column duration_unit text check (duration_unit in ('hours', 'days', 'weeks', 'months')),
  add column duration_quantity integer check (duration_quantity > 0);
