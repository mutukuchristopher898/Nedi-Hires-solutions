// One-off/rerunnable generator: expands src/lib/vehicleCatalog.ts (minus the
// Truck/Bus category, which isn't a rentable car-hire vehicle) into a full
// illustrative demo fleet — both the TypeScript mock array used for display
// (src/lib/data.ts) and the matching Supabase seed SQL (so bookings can
// resolve a real vehicle_id via slug, same pattern as the existing demo
// fleet migration).
//
// Run with: npx tsx scripts/generate-demo-fleet.ts
// Prints two files to scripts/output/: demo-fleet.ts.txt (paste into
// src/lib/data.ts) and demo-fleet.sql (paste into the Supabase SQL editor).
//
// All derived values (price, capacity, rating, trips, plate, location,
// partner assignment) are illustrative, same as the rest of this demo
// fleet — not real pricing or inventory.

import { writeFileSync, mkdirSync } from "fs";
import { vehicleCatalog, type VehicleCatalogEntry } from "../src/lib/vehicleCatalog";

const LOCATIONS = [
  "Nairobi CBD",
  "Jomo Kenyatta International Airport (JKIA)",
  "Mombasa Moi International Airport",
  "Kisumu",
];

const PARTNERS = [
  "Nairobi Wheels Ltd",
  "Rift Valley Rides",
  "Coastal Safari Fleet",
  "Prestige Motors Kenya",
  "Lakeside Tours & Travel",
  "EastAfrica Group Transit",
];

const PREMIUM_MAKES = new Set(["Mercedes-Benz", "BMW", "Audi", "Porsche", "Land Rover", "Jaguar", "Volvo"]);
const COMPACT_EV_MODELS = new Set(["Hongguang Mini EV", "Nammi Box", "Neta V", "Dolphin"]);
const PREMIUM_EV_MODELS = new Set(["Seal", "Taycan", "EQS", "iX"]);
const LUXURY_SEDAN_MODELS = new Set(["Crown", "Mark X"]);

type Classification = "Economy" | "SUV" | "Luxury" | "Bus" | "Road-Trip Van";

function classify(entry: VehicleCatalogEntry): Classification {
  if (entry.category === "Van/MPV") return "Road-Trip Van";
  if (entry.category === "Pickup") return "SUV";
  if (entry.category === "Electric Vehicle") {
    if (COMPACT_EV_MODELS.has(entry.model)) return "Economy";
    if (PREMIUM_MAKES.has(entry.make) || PREMIUM_EV_MODELS.has(entry.model)) return "Luxury";
    return "SUV";
  }
  if (entry.category === "Crossover/SUV") return PREMIUM_MAKES.has(entry.make) ? "Luxury" : "SUV";
  if (entry.category === "Sedan") return PREMIUM_MAKES.has(entry.make) || LUXURY_SEDAN_MODELS.has(entry.model) ? "Luxury" : "Economy";
  return "Economy"; // Hatchback, Station Wagon
}

function capacityFor(entry: VehicleCatalogEntry, classification: Classification): number {
  if (entry.category === "Van/MPV") return 8;
  if (classification === "SUV" || classification === "Luxury") {
    const sevenSeaters = [
      "Land Cruiser Prado (J150)", "Land Cruiser V8 (LC200)", "Fortuner", "MU-X", "Pajero",
      "Patrol", "Outlander", "Santa Fe", "Sorento", "CX-8", "CX-9", "Explorer", "X7", "GLS",
      "Range Rover Vogue", "Discovery", "Q7", "Touareg", "XUV500",
    ];
    return sevenSeaters.includes(entry.model) ? 7 : 5;
  }
  return 5;
}

function priceFor(classification: Classification, category: string): number {
  const base: Record<Classification, number> = { Economy: 3200, SUV: 7500, Luxury: 16000, "Road-Trip Van": 8500, Bus: 9000 };
  let price = base[classification];
  if (category === "Electric Vehicle") price = Math.round(price * 1.25); // EVs command a premium in the Kenyan market
  return price;
}

function imageKeyFor(classification: Classification, category: string): string {
  if (category === "Van/MPV") return "van";
  if (classification === "Luxury") return "luxury";
  if (classification === "SUV") return "suv";
  return "econ";
}

function featuresFor(entry: VehicleCatalogEntry, classification: Classification): string[] {
  const base: string[] = [];
  if (entry.fuelType.includes("Electric")) base.push("Fully Electric", "Fast Charging");
  else if (entry.fuelType.includes("Hybrid")) base.push("Hybrid Engine", "Fuel Efficient");
  if (classification === "Luxury") base.push("Leather Interior", "Premium Sound");
  if (entry.category === "Van/MPV") base.push("Sliding Doors", "Family Seating");
  if (entry.category === "Crossover/SUV" || entry.category === "Pickup") base.push("Reverse Camera");
  if (base.length < 2) base.push("Bluetooth", "USB Charging");
  return Array.from(new Set(base)).slice(0, 3);
}

function descriptionFor(entry: VehicleCatalogEntry, classification: Classification): string {
  if (entry.fuelType.includes("Electric")) return `A modern, fully electric ${entry.make} ${entry.model} — quiet, efficient, and easy on running costs.`;
  if (classification === "Luxury") return `A refined ${entry.make} ${entry.model}, well suited to executive travel and special occasions.`;
  if (entry.category === "Van/MPV") return `Spacious ${entry.make} ${entry.model} for group travel, family trips, and airport transfers.`;
  if (entry.category === "Crossover/SUV") return `A capable ${entry.make} ${entry.model} for both city driving and upcountry road trips.`;
  if (entry.category === "Pickup") return `Rugged ${entry.make} ${entry.model} built for cargo, work, and rough terrain.`;
  return `A dependable ${entry.make} ${entry.model} for everyday self-drive and city errands.`;
}

function slugify(make: string, model: string): string {
  return `demo-${make}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function plateFor(index: number): string {
  const letterPair = String.fromCharCode(65 + (index % 26)) + String.fromCharCode(65 + (Math.floor(index / 26) % 26));
  const num = 100 + (index % 900);
  const suffix = String.fromCharCode(65 + (index % 26));
  return `KD${letterPair}${num}${suffix}`;
}

const rentable = vehicleCatalog.filter((v) => v.category !== "Truck/Bus");

const rows = rentable.map((entry, i) => {
  const classification = classify(entry);
  const year = 2016 + (i % 6);
  const capacity = capacityFor(entry, classification);
  const pricePerDay = priceFor(classification, entry.category);
  const imageKey = imageKeyFor(classification, entry.category);
  const features = featuresFor(entry, classification);
  const description = descriptionFor(entry, classification);
  const slug = slugify(entry.make, entry.model);
  const licensePlate = plateFor(i);
  const location = LOCATIONS[i % LOCATIONS.length];
  const fleetSource = i % 3 === 0 ? "internal" : "partner";
  const partnerName = fleetSource === "partner" ? PARTNERS[i % PARTNERS.length] : undefined;
  const rating = Math.round((4.3 + ((i * 3) % 7) * 0.1) * 10) / 10;
  const trips = 20 + ((i * 13) % 300);
  const fuelType = entry.fuelType[0];
  const transmission = entry.transmission[0];

  return {
    slug, make: entry.make, model: entry.model, year, classification, fuelType, transmission,
    capacity, licensePlate, location, pricePerDay, currency: "KES", rating, trips, imageKey,
    fleetSource, partnerName, approvalStatus: "approved", features, description,
  };
});

mkdirSync("scripts/output", { recursive: true });

const tsLines = rows.map((r) => `  {
    id: "${r.slug}",
    make: "${r.make}",
    model: "${r.model.replace(/"/g, '\\"')}",
    year: ${r.year},
    classification: "${r.classification}",
    fuelType: "${r.fuelType}",
    transmission: "${r.transmission}",
    capacity: ${r.capacity},
    licensePlate: "${r.licensePlate}",
    location: "${r.location}",
    pricePerDay: ${r.pricePerDay},
    currency: "KES",
    rating: ${r.rating},
    trips: ${r.trips},
    image: "${r.imageKey}",
    fleetSource: "${r.fleetSource}",${r.partnerName ? `\n    partnerName: "${r.partnerName}",` : ""}
    approvalStatus: "approved",
    features: [${r.features.map((f) => `"${f}"`).join(", ")}],
    description: "${r.description.replace(/"/g, '\\"')}",
  },`);

writeFileSync("scripts/output/demo-fleet.ts.txt", tsLines.join("\n") + "\n");

const sqlValues = rows.map((r) => {
  const features = `array[${r.features.map((f) => `'${f.replace(/'/g, "''")}'`).join(", ")}]`;
  return `  ('${r.slug}', ${r.partnerName ? `'${r.partnerName}'` : "null"}, true, '${r.make}', '${r.model.replace(/'/g, "''")}', ${r.year}, '${r.classification}', '${r.fuelType}', '${r.transmission}', ${r.capacity}, '${r.licensePlate}', '${r.location}', ${r.pricePerDay}, 'KES', '${r.imageKey}', ${features}, '${r.description.replace(/'/g, "''")}', 'approved')`;
});

const sql = `-- Generated by scripts/generate-demo-fleet.ts — expands the illustrative
-- demo fleet with the full (non-truck/bus) vehicle catalog. All is_demo=true.

insert into vehicles (slug, partner_name, is_demo, make, model, year, classification, fuel_type, transmission, capacity, license_plate, location, price_per_day, currency, image_key, features, description, approval_status)
values
${sqlValues.join(",\n")};
`;

writeFileSync("scripts/output/demo-fleet.sql", sql);

console.log(`Generated ${rows.length} rows.`);
console.log("Wrote scripts/output/demo-fleet.ts.txt and scripts/output/demo-fleet.sql");
