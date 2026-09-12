-- Per-vehicle pricing: long-hire discounts and deposit rates stop being one
-- global figure and become a property of the vehicle, editable by an admin.
--
-- Nullable overrides, not required columns. A platform default lives in
-- pricing_settings and a vehicle only stores what differs — otherwise every
-- one of a few hundred partner listings would need six numbers set before it
-- could be priced at all.
--
-- Owner's decision: admin sets these, not partners. A partner setting their
-- own deposit to zero on a vehicle the platform carries risk on is not
-- something to leave open.

-- ─────────────────────────────────────────────────────────────
-- 1. Platform defaults
--
-- Seeded with exactly today's hardcoded values, so nothing reprices until
-- something is edited.
-- ─────────────────────────────────────────────────────────────

alter table public.pricing_settings
  add column if not exists weekly_threshold_days    int           not null default 7,
  add column if not exists weekly_discount          numeric(5, 4) not null default 0.10,
  add column if not exists monthly_threshold_days   int           not null default 28,
  add column if not exists monthly_discount         numeric(5, 4) not null default 0.25,
  add column if not exists reservation_deposit_rate numeric(5, 4) not null default 0.30,
  add column if not exists security_deposit_rate    numeric(5, 4) not null default 0.15;

alter table public.pricing_settings
  drop constraint if exists pricing_settings_rates_sane;
alter table public.pricing_settings
  add constraint pricing_settings_rates_sane check (
    weekly_threshold_days    >= 1
    and monthly_threshold_days >= weekly_threshold_days
    and weekly_discount   >= 0 and weekly_discount   < 1
    and monthly_discount  >= 0 and monthly_discount  < 1
    and reservation_deposit_rate >= 0 and reservation_deposit_rate <= 1
    and security_deposit_rate    >= 0 and security_deposit_rate    <= 1
  );

-- ─────────────────────────────────────────────────────────────
-- 2. Per-vehicle overrides
--
-- NULL means "use the platform default". Distinguishing that from an
-- explicit zero matters: a vehicle with no long-hire discount at all is a
-- real choice, and 0 says it where NULL would silently inherit 10%.
-- ─────────────────────────────────────────────────────────────

alter table public.vehicles
  add column if not exists weekly_threshold_days    int,
  add column if not exists weekly_discount          numeric(5, 4),
  add column if not exists monthly_threshold_days   int,
  add column if not exists monthly_discount         numeric(5, 4),
  add column if not exists reservation_deposit_rate numeric(5, 4),
  add column if not exists security_deposit_rate    numeric(5, 4);

alter table public.vehicles
  drop constraint if exists vehicles_pricing_overrides_sane;
alter table public.vehicles
  add constraint vehicles_pricing_overrides_sane check (
    (weekly_threshold_days    is null or weekly_threshold_days  >= 1)
    and (monthly_threshold_days is null or monthly_threshold_days >= 1)
    and (weekly_discount   is null or (weekly_discount   >= 0 and weekly_discount   < 1))
    and (monthly_discount  is null or (monthly_discount  >= 0 and monthly_discount  < 1))
    and (reservation_deposit_rate is null or (reservation_deposit_rate >= 0 and reservation_deposit_rate <= 1))
    and (security_deposit_rate    is null or (security_deposit_rate    >= 0 and security_deposit_rate    <= 1))
  ) not valid;

-- Every existing row has all six NULL, so this holds already.
alter table public.vehicles validate constraint vehicles_pricing_overrides_sane;

-- Partners must not price their own discounts or deposits. They can already
-- update their own vehicles (20260912090000), which would otherwise include
-- these columns. RLS cannot express it — a check expression cannot see OLD.
create or replace function public.prevent_partner_pricing_override()
returns trigger
language plpgsql            -- no security definer: discriminates on is_admin()
set search_path = public
as $fn$
begin
  if is_admin() then
    return new;
  end if;

  if new.weekly_threshold_days    is distinct from old.weekly_threshold_days
     or new.weekly_discount          is distinct from old.weekly_discount
     or new.monthly_threshold_days   is distinct from old.monthly_threshold_days
     or new.monthly_discount         is distinct from old.monthly_discount
     or new.reservation_deposit_rate is distinct from old.reservation_deposit_rate
     or new.security_deposit_rate    is distinct from old.security_deposit_rate then
    raise exception 'Discounts and deposit rates are set by the platform, not by partners';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_prevent_partner_pricing_override on public.vehicles;
create trigger trg_prevent_partner_pricing_override
  before update on public.vehicles
  for each row execute function public.prevent_partner_pricing_override();

-- ─────────────────────────────────────────────────────────────
-- 3. The pricing function takes its rates as arguments
--
-- Stays immutable — it is still a pure function of its inputs. Reading the
-- rates is the trigger's job, which already reads vehicles and is already
-- security definer. Keeping the maths pure means it can still be reasoned
-- about and tested in isolation.
-- ─────────────────────────────────────────────────────────────

create or replace function public.booking_price_total(
  p_rate                   numeric,
  p_days                   integer,
  p_weekly_threshold_days  integer,
  p_weekly_discount        numeric,
  p_monthly_threshold_days integer,
  p_monthly_discount       numeric
)
returns numeric
language sql
immutable
as $fn$
  select case
    when p_days >= p_monthly_threshold_days then round(p_rate * p_days * (1 - p_monthly_discount))
    when p_days >= p_weekly_threshold_days  then round(p_rate * p_days * (1 - p_weekly_discount))
    -- The sub-threshold branch is deliberately unrounded, matching the TS.
    else                                         p_rate * p_days
  end;
$fn$;

-- The two-argument version hardcoded 0.75/0.90 and 28/7. Nothing calls it now.
drop function if exists public.booking_price_total(numeric, integer);

-- ─────────────────────────────────────────────────────────────
-- 4. The money trigger resolves each vehicle's rates
--
-- Identical to 20260903120000 except for where the rates come from. The
-- freeze branch, the rate lock, the drop-off and 90-day validations and the
-- currency overwrite are all unchanged.
--
-- Note there is no need to lock the resolved rates onto the booking the way
-- rate_per_day is locked. Money is only recomputed when a pricing input
-- moves, and after creation vehicle_id is frozen by
-- prevent_booking_field_tampering() while the wizard offers no way to change
-- dates — so a booking's money is already fixed at creation. Editing a
-- vehicle's discount never reaches a booking already placed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_booking_money()
returns trigger
language plpgsql
security definer set search_path = public   -- reads vehicles and pricing_settings
as $fn$
declare
  v_rate     numeric(10, 2);
  v_currency text;
  v_days     integer;
  v_fee      numeric;
  v_total    numeric;
  v_repriced boolean;
  v_weekly_days    integer;
  v_weekly_disc    numeric;
  v_monthly_days   integer;
  v_monthly_disc   numeric;
  v_reserve_rate   numeric;
  v_security_rate  numeric;
begin
  if tg_op = 'UPDATE' then
    v_repriced :=
         new.vehicle_id    is distinct from old.vehicle_id
      or new.pickup_at     is distinct from old.pickup_at
      or new.dropoff_at    is distinct from old.dropoff_at
      or new.start_date    is distinct from old.start_date
      or new.end_date      is distinct from old.end_date
      or new.pickup_point  is distinct from old.pickup_point
      or new.dropoff_point is distinct from old.dropoff_point;

    if not v_repriced then
      if is_admin() then
        return new;
      end if;

      new.total_amount     := old.total_amount;
      new.deposit_amount   := old.deposit_amount;
      new.security_deposit := old.security_deposit;
      new.one_way_fee      := old.one_way_fee;
      new.rate_per_day     := old.rate_per_day;
      new.currency         := old.currency;
      return new;
    end if;
  end if;

  -- A vehicle's override where it has one, the platform default otherwise.
  select v.price_per_day,
         v.currency,
         coalesce(v.weekly_threshold_days,    s.weekly_threshold_days),
         coalesce(v.weekly_discount,          s.weekly_discount),
         coalesce(v.monthly_threshold_days,   s.monthly_threshold_days),
         coalesce(v.monthly_discount,         s.monthly_discount),
         coalesce(v.reservation_deposit_rate, s.reservation_deposit_rate),
         coalesce(v.security_deposit_rate,    s.security_deposit_rate)
    into v_rate, v_currency,
         v_weekly_days, v_weekly_disc,
         v_monthly_days, v_monthly_disc,
         v_reserve_rate, v_security_rate
  from vehicles v
  cross join pricing_settings s
  where v.id = new.vehicle_id
    and s.id;

  if v_rate is null then
    raise exception 'Cannot price a booking against an unknown vehicle';
  end if;

  -- Rate lock: an existing booking keeps the rate it was quoted at.
  if tg_op = 'UPDATE' and old.rate_per_day is not null
     and new.vehicle_id = old.vehicle_id then
    v_rate     := old.rate_per_day;
    v_currency := old.currency;
  end if;

  if new.pickup_at is not null and new.dropoff_at is not null
     and new.dropoff_at <= new.pickup_at then
    raise exception 'Drop-off must be after pickup';
  end if;

  v_days := booking_effective_days(new.pickup_at, new.dropoff_at,
                                   new.start_date, new.end_date);

  if v_days > 90 then
    raise exception 'The maximum rental period is 90 days';
  end if;

  v_fee   := booking_one_way_fee(new.pickup_point, new.dropoff_point);
  v_total := booking_price_total(v_rate, v_days,
                                 v_weekly_days, v_weekly_disc,
                                 v_monthly_days, v_monthly_disc) + v_fee;

  new.rate_per_day := v_rate;
  new.currency     := v_currency;
  new.one_way_fee  := v_fee;
  new.total_amount := v_total;

  new.deposit_amount   := round(v_total * v_reserve_rate);
  new.security_deposit := round(v_total * v_security_rate);

  return new;
end;
$fn$;
