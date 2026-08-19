-- Backs the frontend's illustrative demo fleet with real vehicle rows so
-- bookings (which have a not-null FK to vehicles.id) can actually persist.
-- `slug` lets the app resolve a real UUID from the stable mock/demo id used
-- in URLs. `is_demo` distinguishes illustrative rows from the real starting
-- fleet (the 2 Fielders in seed.sql) so demo data can be pruned later without
-- touching real inventory.

alter table vehicles
  add column slug text unique,
  add column partner_name text,
  add column is_demo boolean not null default false;

-- Tag + slug the 2 real Fielders already seeded.
update vehicles set slug = 'fielder-real-1', is_demo = false
  where license_plate = 'KDA 214B' and year = 2018;
update vehicles set slug = 'fielder-real-2', is_demo = false
  where license_plate = 'KDB 552C' and year = 2019;

-- Illustrative demo fleet shown across the marketing/search pages.
insert into vehicles (slug, partner_name, is_demo, make, model, year, classification, fuel_type, transmission, capacity, license_plate, location, price_per_day, currency, image_key, features, description, approval_status)
values
  ('v-axio', null, true, 'Toyota', 'Axio', 2019, 'Economy', 'Petrol', 'Automatic', 5, 'KDA 214B',
    'Jomo Kenyatta International Airport (JKIA)', 3500, 'KES', 'econ',
    array['Bluetooth', 'Reverse Camera', 'Fuel Efficient'],
    'A dependable everyday saloon, perfect for city errands and short self-drive trips.', 'approved'),
  ('v-fielder', 'Nairobi Wheels Ltd', true, 'Toyota', 'Fielder', 2018, 'Economy', 'Petrol', 'Automatic', 5, 'KDB 552C',
    'Nairobi CBD', 3800, 'KES', 'econ',
    array['Spacious Boot', 'USB Charging'],
    'A roomy, fuel-sipping wagon favoured by families running weekend errands.', 'approved'),
  ('v-demio', null, true, 'Mazda', 'Demio', 2017, 'Economy', 'Petrol', 'Automatic', 4, 'KDC 908D',
    'Nairobi CBD', 3200, 'KES', 'econ',
    array['Compact & Easy to Park', 'Bluetooth'],
    'Nimble and economical — ideal for solo travelers navigating city traffic.', 'approved'),
  ('v-note', 'Nairobi Wheels Ltd', true, 'Nissan', 'Note', 2016, 'Economy', 'Hybrid', 'Automatic', 5, 'KDD 341E',
    'Nairobi CBD', 3400, 'KES', 'econ',
    array['Hybrid Engine', 'Reverse Camera'],
    'Fuel-sipping hybrid for everyday consumers running daily errands around town.', 'approved'),
  ('v-harrier', null, true, 'Toyota', 'Harrier', 2018, 'SUV', 'Petrol', 'Automatic', 5, 'KDE 771D',
    'Jomo Kenyatta International Airport (JKIA)', 7500, 'KES', 'suv',
    array['Panoramic Roof', 'Reverse Camera', 'Apple CarPlay'],
    'A comfortable, stylish crossover — a favourite airport pickup for returning diaspora.', 'approved'),
  ('v-cx5', 'Rift Valley Rides', true, 'Mazda', 'CX-5', 2019, 'SUV', 'Petrol', 'Automatic', 5, 'KDF 118E',
    'Nairobi CBD', 8200, 'KES', 'suv',
    array['All-Wheel Drive', 'Premium Sound', 'Leather Seats'],
    'Refined handling and comfort for weekend getaways or upcountry family trips.', 'approved'),
  ('v-xtrail', null, true, 'Nissan', 'X-Trail', 2017, 'SUV', 'Petrol', 'Automatic', 7, 'KDG 902F',
    'Mombasa Moi International Airport', 7800, 'KES', 'suv',
    array['7-Seater', 'Roof Rack', 'Reverse Camera'],
    'Practical 7-seater for coastal road trips and family transfers with extra luggage.', 'approved'),
  ('v-prado', 'Coastal Safari Fleet', true, 'Toyota', 'Land Cruiser Prado (J150)', 2016, 'SUV', 'Diesel', 'Automatic', 7, 'KDH 340G',
    'Nairobi CBD', 12500, 'KES', 'suv',
    array['4x4 Off-Road', 'Diesel Range', 'Roof Rack'],
    'Rugged and capable — built for upcountry roads, off-road stretches, and safari transfers.', 'pending'),
  ('v-crown', null, true, 'Toyota', 'Crown', 2015, 'Luxury', 'Petrol', 'Automatic', 4, 'KDJ 615H',
    'Jomo Kenyatta International Airport (JKIA)', 14000, 'KES', 'luxury',
    array['Chauffeur Available', 'Leather Interior', 'Airport Meet & Greet'],
    'A dignified executive saloon for corporate clients and VIP airport arrivals.', 'approved'),
  ('v-alphard', 'Prestige Motors Kenya', true, 'Toyota', 'Alphard', 2018, 'Luxury', 'Petrol', 'Automatic', 7, 'KDK 483J',
    'Nairobi CBD', 18500, 'KES', 'luxury',
    array['Chauffeur Available', 'Captain Seats', 'Premium Sound'],
    'Spacious, plush, and chauffeur-driven — the choice for weddings and VIP group transfers.', 'approved'),
  ('v-markx', 'Prestige Motors Kenya', true, 'Toyota', 'Mark X', 2014, 'Luxury', 'Petrol', 'Automatic', 5, 'KDL 907K',
    'Nairobi CBD', 9500, 'KES', 'luxury',
    array['Sport Trim', 'Leather Interior'],
    'A sharp-handling executive saloon with sporty road presence for city driving.', 'pending'),
  ('v-noah', null, true, 'Toyota', 'Noah', 2015, 'Road-Trip Van', 'Petrol', 'Automatic', 8, 'KDM 220L',
    'Nairobi CBD', 8500, 'KES', 'van',
    array['Sliding Doors', 'Family Seating', 'Luggage Space'],
    'Easy-access family van, ideal for group trips, church outings, and family reunions.', 'approved'),
  ('v-serena', 'Lakeside Tours & Travel', true, 'Toyota', 'Serena', 2014, 'Road-Trip Van', 'Petrol', 'Automatic', 8, 'KDN 118M',
    'Kisumu', 8000, 'KES', 'van',
    array['Group Seating', 'Roof Storage'],
    'Reliable group van for tour operators shuttling between lakeside attractions.', 'approved'),
  ('v-safari-tour', 'EastAfrica Group Transit', true, 'Toyota', 'Land Cruiser Safari (Pop-Up Roof)', 2017, 'Bus', 'Diesel', 'Manual', 7, 'KDP 615N',
    'Nairobi CBD', 22000, 'KES', 'bus',
    array['Pop-Up Viewing Roof', 'Guide on Request', '4x4 Off-Road'],
    'Purpose-built safari vehicle with a pop-up roof for game viewing on tours & safaris.', 'approved');
