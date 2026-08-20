-- Segmented subscriptions: audience targeting + quarterly/annual pricing.
-- All new pricing below is illustrative/placeholder — adjust once real
-- figures are set (flagged in the frontend with an "Indicative Pricing" tag).

alter table subscription_plans
  add column audience text not null default 'individual'
    check (audience in ('individual', 'diaspora', 'corporate', 'partner')),
  add column quarterly_price numeric(10, 2),
  add column annual_price numeric(10, 2),
  add column vehicle_count_max int;

alter table subscription_plans alter column monthly_price drop not null;

alter table subscription_plans
  add constraint subscription_plans_price_present
  check (monthly_price is not null or quarterly_price is not null or annual_price is not null);

-- Placeholder "2 months free" annual discount on the 3 existing real plans —
-- owner to confirm real annual pricing.
update subscription_plans set annual_price = monthly_price * 10
  where name in ('Starter Mobility', 'Explorer Plus', 'Executive Access');

insert into subscription_plans (name, audience, monthly_price, annual_price, currency, tier_classes, swaps_per_month, perks)
values
  ('Diaspora Homecoming', 'diaspora', 120000, 1200000, 'KES', array['SUV', 'Luxury'], 2,
    array['Airport meet & greet on arrival', 'Vehicle delivered to your accommodation', 'SUV & Luxury tier access', '24/7 diaspora concierge line']);

insert into subscription_plans (name, audience, quarterly_price, annual_price, currency, tier_classes, swaps_per_month, perks)
values
  ('Corporate & Hospitality Partner', 'corporate', 400000, 1440000, 'KES', array['Economy', 'SUV', 'Luxury'], 4,
    array['Full fleet access for staff & guest transport', 'Consolidated invoicing', 'Dedicated account manager', 'Priority booking during peak season']);

insert into subscription_plans (name, audience, monthly_price, annual_price, currency, tier_classes, swaps_per_month, vehicle_count_max, perks)
values
  ('Partner Fleet Starter', 'partner', 5000, 50000, 'KES', array[]::text[], 0, 5,
    array['List up to 5 vehicles on the platform', 'Partner dashboard access', 'Standard commission rate on bookings']);
