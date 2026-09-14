-- ─────────────────────────────────────────────────────────────
-- Price in dollars
--
-- Every vehicle and subscription plan was priced in shillings. They are now
-- priced in dollars, converted at roughly 130 KES to the dollar and rounded to
-- a clean figure rather than carried across to the cent: a hire rate of $29.23
-- reads like a conversion, and a stale rate slowly turns every price wrong.
-- Rounded prices are just prices.
--
--   KES 3,200/day  ->  $25        KES  8,500/day  ->  $65
--   KES 3,800/day  ->  $30        KES 22,000/day  ->  $170
--
-- Every statement is filtered on `currency = 'KES'`, so running this twice
-- converts nothing the second time. Without that a re-run would divide the
-- dollar prices by 130 again and put the whole fleet on sale at 25 cents.
--
-- EXISTING BOOKINGS ARE DELIBERATELY NOT TOUCHED. A booking holds a price a
-- customer agreed to; rewriting it would change what they owe. They keep their
-- KES amounts and their KES currency, and formatMoney renders them in
-- shillings because it reads the currency off the row rather than assuming.
-- enforce_booking_money() already locks `currency` alongside `rate_per_day`,
-- so editing one of those bookings cannot drag it into dollars either.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Vehicles, to the nearest $5 ──────────────────────────
update public.vehicles
set price_per_day = greatest(round(price_per_day / 130.0 / 5.0) * 5.0, 5.0),
    currency      = 'USD'
where currency = 'KES';

-- ── 2. Subscription plans ───────────────────────────────────
-- Coarser rounding than vehicles because the numbers are bigger: $10 steps
-- monthly, $50 quarterly and annually. Null prices are the "on request" tiers
-- and stay null — only one plan has a quarterly price at all.
update public.subscription_plans
set monthly_price = case
      when monthly_price is null then null
      else greatest(round(monthly_price / 130.0 / 10.0) * 10.0, 10.0)
    end,
    quarterly_price = case
      when quarterly_price is null then null
      else greatest(round(quarterly_price / 130.0 / 50.0) * 50.0, 50.0)
    end,
    annual_price = case
      when annual_price is null then null
      else greatest(round(annual_price / 130.0 / 50.0) * 50.0, 50.0)
    end,
    currency = 'USD'
where currency = 'KES';

-- ── 3. Loyalty points ───────────────────────────────────────
-- This is the trap in switching currency. The trigger short-circuited on any
-- non-KES booking, with a comment saying every booking is KES anyway. From
-- today none of them are, so leaving it alone would have quietly stopped every
-- customer earning points, with nothing failing to show it.
--
-- KES 100 per point becomes $1 per point. Not an exact conversion — $1 is
-- about 1.3 points under the old rule — but a customer can hold "a point per
-- dollar" in their head, and the tier thresholds stay where they are.
--
-- The KES branch stays: a booking placed before the switch is still in
-- shillings, and confirming one now should still award points at the rate it
-- was quoted under.
create or replace function public.award_loyalty_points_on_confirm()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_points int;
  v_lifetime int;
  v_tier text;
begin
  if new.currency = 'USD' then
    v_points := floor(new.total_amount);
  elsif new.currency = 'KES' then
    v_points := floor(new.total_amount / 100);
  else
    -- No rule for euros or sterling, and inventing one would award points at
    -- the wrong scale. Skip rather than guess.
    return new;
  end if;

  insert into loyalty_accounts (customer_id, points_balance, lifetime_points)
  values (new.customer_id, v_points, v_points)
  on conflict (customer_id) do update
    set points_balance  = loyalty_accounts.points_balance + v_points,
        lifetime_points = loyalty_accounts.lifetime_points + v_points,
        updated_at = now()
  returning lifetime_points into v_lifetime;

  v_tier := case
    when v_lifetime >= 5000 then 'gold'
    when v_lifetime >= 1500 then 'silver'
    else 'bronze'
  end;

  update loyalty_accounts set tier = v_tier where customer_id = new.customer_id;

  insert into loyalty_transactions (customer_id, booking_id, points_delta, reason)
  values (new.customer_id, new.id, v_points, 'Booking ' || new.booking_ref || ' confirmed');

  return new;
end;
$fn$;

-- ── 4. New rows default to dollars ──────────────────────────
alter table public.vehicles           alter column currency set default 'USD';
alter table public.bookings           alter column currency set default 'USD';
alter table public.subscription_plans alter column currency set default 'USD';
