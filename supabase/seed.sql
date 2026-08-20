-- Seed data for local development.
-- Subscription plans are real product config (the individual-audience 3 are
-- the real plans; diaspora/corporate/partner plans use illustrative
-- placeholder pricing — see the matching migration). The vehicles below
-- reflect the actual starting fleet (per the founder's investment summary)
-- rather than the richer illustrative fleet shown in the frontend demo —
-- swap/add real units here as the fleet grows.

insert into subscription_plans (name, audience, monthly_price, annual_price, currency, tier_classes, swaps_per_month, highlight, perks)
values
  ('Starter Mobility', 'individual', 45000, 450000, 'KES', array['Economy'], 1, false,
    array['Unlimited mileage on Economy tier', '1 vehicle swap per month', 'Priority roadside support']),
  ('Explorer Plus', 'individual', 95000, 950000, 'KES', array['Economy', 'SUV'], 2, true,
    array['Access to Economy & SUV tiers', '2 vehicle swaps per month', 'Free airport meet & greet', 'Dedicated relationship manager']),
  ('Executive Access', 'individual', 175000, 1750000, 'KES', array['Economy', 'SUV', 'Luxury'], 4, false,
    array['Full fleet access including Luxury', '4 vehicle swaps per month', 'Chauffeur credits included', 'Corporate invoicing']);

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

insert into vehicles (make, model, year, classification, fuel_type, transmission, capacity, license_plate, location, price_per_day, currency, image_key, features, description, approval_status)
values
  ('Toyota', 'Fielder', 2018, 'Economy', 'Petrol', 'Automatic', 5, 'KDA 214B',
    'Nairobi CBD', 3800, 'KES', 'econ',
    array['Spacious Boot', 'USB Charging'],
    'A roomy, fuel-sipping wagon favoured by families running weekend errands.',
    'approved'),
  ('Toyota', 'Fielder', 2019, 'Economy', 'Petrol', 'Automatic', 5, 'KDB 552C',
    'Nairobi CBD', 3800, 'KES', 'econ',
    array['Spacious Boot', 'USB Charging'],
    'Second unit of our starting fleet, ready for daily and weekly hire.',
    'approved');
