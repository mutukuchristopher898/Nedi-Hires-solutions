-- Seed data for local development.
-- Subscription plans are real product config. The vehicles below reflect the
-- actual starting fleet (per the founder's investment summary) rather than
-- the richer illustrative fleet shown in the frontend demo — swap/add real
-- units here as the fleet grows.

insert into subscription_plans (name, monthly_price, currency, tier_classes, swaps_per_month, highlight, perks)
values
  ('Starter Mobility', 45000, 'KES', array['Economy'], 1, false,
    array['Unlimited mileage on Economy tier', '1 vehicle swap per month', 'Priority roadside support']),
  ('Explorer Plus', 95000, 'KES', array['Economy', 'SUV'], 2, true,
    array['Access to Economy & SUV tiers', '2 vehicle swaps per month', 'Free airport meet & greet', 'Dedicated relationship manager']),
  ('Executive Access', 175000, 'KES', array['Economy', 'SUV', 'Luxury'], 4, false,
    array['Full fleet access including Luxury', '4 vehicle swaps per month', 'Chauffeur credits included', 'Corporate invoicing']);

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
