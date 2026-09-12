-- One-way fees become data instead of a constant.
--
-- The fee was a flat KES 6,000 for any cross-location trip, hardcoded in both
-- booking_one_way_fee() and src/lib/duration.ts. Nairobi-JKIA and
-- Nairobi-Mombasa are wildly different repositioning jobs, so one flat number
-- over-charges most routes and under-charges the rest.
--
-- Partners now type their pickup location as free text, so the set of routes
-- is open-ended: a partner listing in Nakuru creates pairs no table has heard
-- of. Per the owner's decision, an unlisted pair falls back to a default fee
-- rather than being free or blocked — nothing is ever under-charged by
-- accident.
--
-- Seeded so behaviour is byte-identical to today until the fees are edited.

create table if not exists public.pricing_settings (
  -- Single-row table: the `check (id)` means true is the only permitted key,
  -- so a second settings row cannot be created.
  id boolean primary key default true check (id),
  default_one_way_fee numeric(10, 2) not null default 6000 check (default_one_way_fee >= 0),
  updated_at timestamptz not null default now()
);

insert into public.pricing_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.one_way_fees (
  -- Stored in canonical order so a pair is symmetric: one row covers both
  -- directions, and there is no way to record two different fees for the
  -- same journey depending on which way round it is asked.
  location_a text not null,
  location_b text not null,
  fee numeric(10, 2) not null check (fee >= 0),
  updated_at timestamptz not null default now(),
  primary key (location_a, location_b),
  constraint one_way_fees_canonical_order check (location_a < location_b)
);

alter table public.pricing_settings enable row level security;
alter table public.one_way_fees enable row level security;

-- Publicly readable: the booking form quotes the fee live as a customer picks
-- a drop-off point, and most of those customers are not signed in. Neither
-- table holds anything private — these are published prices.
drop policy if exists "Pricing settings are publicly readable" on public.pricing_settings;
create policy "Pricing settings are publicly readable" on public.pricing_settings
  for select to anon, authenticated using (true);

drop policy if exists "One-way fees are publicly readable" on public.one_way_fees;
create policy "One-way fees are publicly readable" on public.one_way_fees
  for select to anon, authenticated using (true);

drop policy if exists "Admins manage pricing settings" on public.pricing_settings;
create policy "Admins manage pricing settings" on public.pricing_settings
  for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins insert one-way fees" on public.one_way_fees;
create policy "Admins insert one-way fees" on public.one_way_fees
  for insert to authenticated with check (is_admin());

drop policy if exists "Admins update one-way fees" on public.one_way_fees;
create policy "Admins update one-way fees" on public.one_way_fees
  for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins delete one-way fees" on public.one_way_fees;
create policy "Admins delete one-way fees" on public.one_way_fees
  for delete to authenticated using (is_admin());

-- ─────────────────────────────────────────────────────────────
-- The lookup
--
-- Was `immutable`, which is why the fee had to be a literal: an immutable
-- function may not read a table. Now `stable`, which is correct for something
-- that reads database state and is still fine everywhere this is called —
-- enforce_booking_money's trigger body and the backfill. It is not used in an
-- index or a generated column, which is where stable would not be allowed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.booking_one_way_fee(p_pickup text, p_dropoff text)
returns numeric
language sql
stable
set search_path = public
as $fn$
  select (case
    when p_pickup is null or p_dropoff is null          then 0
    when btrim(p_pickup) = '' or btrim(p_dropoff) = ''  then 0
    when p_pickup = p_dropoff                           then 0
    else coalesce(
      (select f.fee
         from public.one_way_fees f
        where f.location_a = least(btrim(p_pickup), btrim(p_dropoff))
          and f.location_b = greatest(btrim(p_pickup), btrim(p_dropoff))),
      (select s.default_one_way_fee from public.pricing_settings s where s.id),
      0
    )
  end)::numeric;
$fn$;

-- Seed the six pairs the current fleet's four pickup points make, at today's
-- flat rate. Nothing changes for anyone until these are edited — they exist so
-- the admin screen opens with real routes to edit rather than an empty table.
insert into public.one_way_fees (location_a, location_b, fee)
select least(a, b), greatest(a, b), 6000
from (
  select unnest(array[
    'Nairobi CBD',
    'Jomo Kenyatta International Airport (JKIA)',
    'Mombasa Moi International Airport',
    'Kisumu'
  ]) as a
) x
cross join (
  select unnest(array[
    'Nairobi CBD',
    'Jomo Kenyatta International Airport (JKIA)',
    'Mombasa Moi International Airport',
    'Kisumu'
  ]) as b
) y
where a < b
on conflict (location_a, location_b) do nothing;
