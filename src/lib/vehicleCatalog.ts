// Canonical Kenya-market vehicle catalog — used to power make/model
// selection (e.g. the partner vehicle-listing form) instead of free text.
//
// IMPORTANT: cc, transmission/fuel options, and colours are REPRESENTATIVE
// typical values for each nameplate as commonly sold/imported in Kenya, not
// verified per-VIN factory data pulled from a manufacturer database. Treat
// this as a general reference to refine over time, not an authoritative
// spec sheet. `yearRange` is fixed to 2016–2021 for every entry per the
// current catalog scope, regardless of a model's full production history.

export type VehicleCatalogCategory =
  | "Hatchback"
  | "Sedan"
  | "Station Wagon"
  | "Crossover/SUV"
  | "Van/MPV"
  | "Pickup"
  | "Truck/Bus"
  | "Electric Vehicle";

export type CatalogTransmission = "Manual" | "Automatic";
export type CatalogFuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";

export interface VehicleCatalogEntry {
  make: string;
  model: string;
  category: VehicleCatalogCategory;
  yearRange: string;
  transmission: CatalogTransmission[];
  fuelType: CatalogFuelType[];
  cc: string;
  colors: string[];
}

const YEAR_RANGE = "2016–2021";

const STANDARD_COLORS = ["Pearl White", "Silver", "Black", "Grey", "Blue", "Wine Red"];
const COMPACT_COLORS = ["Pearl White", "Silver", "Black", "Red", "Blue", "Champagne Gold"];
const PREMIUM_COLORS = ["Alpine White", "Obsidian Black", "Selenite Grey", "Mineral Silver", "Deep Blue", "Champagne Gold"];
const RUGGED_COLORS = ["Pearl White", "Silver", "Black", "Grey", "Beige", "Dark Green"];
const COMMERCIAL_COLORS = ["White", "Silver", "Yellow", "Red"];
const EV_COLORS = ["Pearl White", "Midnight Black", "Silver", "Deep Blue", "Cyber Grey"];

function entry(
  make: string,
  model: string,
  category: VehicleCatalogCategory,
  transmission: CatalogTransmission[],
  fuelType: CatalogFuelType[],
  cc: string,
  colors: string[] = STANDARD_COLORS
): VehicleCatalogEntry {
  return { make, model, category, yearRange: YEAR_RANGE, transmission, fuelType, cc, colors };
}

export const vehicleCatalog: VehicleCatalogEntry[] = [
  // ── Toyota ──────────────────────────────────────────────
  entry("Toyota", "Vitz", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000–1500cc", COMPACT_COLORS),
  entry("Toyota", "Passo", "Hatchback", ["Automatic"], ["Petrol"], "1000cc", COMPACT_COLORS),
  entry("Toyota", "Aqua", "Hatchback", ["Automatic"], ["Hybrid"], "1500cc", COMPACT_COLORS),
  entry("Toyota", "Ractis", "Hatchback", ["Automatic"], ["Petrol"], "1300–1500cc", COMPACT_COLORS),
  entry("Toyota", "Ist", "Hatchback", ["Automatic"], ["Petrol"], "1300–1500cc", COMPACT_COLORS),
  entry("Toyota", "Auris", "Hatchback", ["Automatic", "Manual"], ["Petrol", "Hybrid"], "1500–1800cc", COMPACT_COLORS),
  entry("Toyota", "Allex", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1500cc", COMPACT_COLORS),
  entry("Toyota", "RunX", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1500–1800cc", COMPACT_COLORS),
  entry("Toyota", "Duet", "Hatchback", ["Automatic"], ["Petrol"], "1000cc", COMPACT_COLORS),
  entry("Toyota", "Starlet", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1300cc", COMPACT_COLORS),
  entry("Toyota", "Corolla Axio", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", STANDARD_COLORS),
  entry("Toyota", "Premio", "Sedan", ["Automatic"], ["Petrol"], "1500–1800cc", STANDARD_COLORS),
  entry("Toyota", "Allion", "Sedan", ["Automatic"], ["Petrol"], "1500–1800cc", STANDARD_COLORS),
  entry("Toyota", "Belta", "Sedan", ["Automatic"], ["Petrol"], "1300–1500cc", STANDARD_COLORS),
  entry("Toyota", "Crown", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "2000–3500cc", PREMIUM_COLORS),
  entry("Toyota", "Mark X", "Sedan", ["Automatic"], ["Petrol"], "2500–3500cc", PREMIUM_COLORS),
  entry("Toyota", "Camry", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "2000–2500cc", STANDARD_COLORS),
  entry("Toyota", "Platz", "Sedan", ["Automatic"], ["Petrol"], "1000–1500cc", STANDARD_COLORS),
  entry("Toyota", "Corolla Fielder", "Station Wagon", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", STANDARD_COLORS),
  entry("Toyota", "Probox", "Station Wagon", ["Manual", "Automatic"], ["Petrol"], "1300–1500cc", COMMERCIAL_COLORS),
  entry("Toyota", "Succeed", "Station Wagon", ["Manual", "Automatic"], ["Petrol"], "1500cc", COMMERCIAL_COLORS),
  entry("Toyota", "Caldina", "Station Wagon", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "Avensis Wagon", "Station Wagon", ["Automatic"], ["Petrol", "Diesel"], "1800–2200cc", STANDARD_COLORS),
  entry("Toyota", "RAV4", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000–2500cc", STANDARD_COLORS),
  entry("Toyota", "Vanguard", "Crossover/SUV", ["Automatic"], ["Petrol"], "2400–3500cc", STANDARD_COLORS),
  entry("Toyota", "Harrier", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000–2500cc", PREMIUM_COLORS),
  entry("Toyota", "Rush", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Toyota", "Corolla Cross", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "Fortuner", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol", "Diesel"], "2700–2800cc", RUGGED_COLORS),
  entry("Toyota", "Land Cruiser Prado (J150)", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2700–3000cc", RUGGED_COLORS),
  entry("Toyota", "Land Cruiser V8 (LC200)", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "4600–4500cc", RUGGED_COLORS),
  entry("Toyota", "Hiace", "Van/MPV", ["Manual", "Automatic"], ["Diesel", "Petrol"], "2700–3000cc", COMMERCIAL_COLORS),
  entry("Toyota", "Noah", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "Voxy", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "Alphard", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "2400–3500cc", PREMIUM_COLORS),
  entry("Toyota", "Vellfire", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "2400–3500cc", PREMIUM_COLORS),
  entry("Toyota", "Sienta", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", COMPACT_COLORS),
  entry("Toyota", "Wish", "Van/MPV", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "Isis", "Van/MPV", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Toyota", "TownAce", "Van/MPV", ["Manual", "Automatic"], ["Petrol", "Diesel"], "1500–2000cc", COMMERCIAL_COLORS),
  entry("Toyota", "Passo Sette", "Van/MPV", ["Automatic"], ["Petrol"], "1500cc", COMPACT_COLORS),
  entry("Toyota", "Hilux", "Pickup", ["Manual", "Automatic"], ["Diesel", "Petrol"], "2400–2800cc", RUGGED_COLORS),
  entry("Toyota", "Land Cruiser Pickup (LC79)", "Pickup", ["Manual"], ["Diesel"], "4200cc", RUGGED_COLORS),
  entry("Toyota", "bZ4X", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Nissan ──────────────────────────────────────────────
  entry("Nissan", "Note", "Hatchback", ["Automatic"], ["Petrol", "Hybrid"], "1200–1500cc", COMPACT_COLORS),
  entry("Nissan", "March", "Hatchback", ["Automatic"], ["Petrol"], "1200cc", COMPACT_COLORS),
  entry("Nissan", "Cube", "Hatchback", ["Automatic"], ["Petrol"], "1500cc", COMPACT_COLORS),
  entry("Nissan", "Tiida (Hatchback)", "Hatchback", ["Automatic"], ["Petrol"], "1500–1800cc", COMPACT_COLORS),
  entry("Nissan", "Sylphy", "Sedan", ["Automatic"], ["Petrol"], "1500–1800cc", STANDARD_COLORS),
  entry("Nissan", "Bluebird Sylphy", "Sedan", ["Automatic"], ["Petrol"], "1500–1800cc", STANDARD_COLORS),
  entry("Nissan", "Teana", "Sedan", ["Automatic"], ["Petrol"], "2000–2500cc", STANDARD_COLORS),
  entry("Nissan", "Tiida Latio", "Sedan", ["Automatic"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Nissan", "Sunny", "Sedan", ["Automatic", "Manual"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Nissan", "Almera", "Sedan", ["Automatic", "Manual"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Nissan", "X-Trail", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000–2500cc", STANDARD_COLORS),
  entry("Nissan", "Juke", "Crossover/SUV", ["Automatic"], ["Petrol"], "1500–1600cc", COMPACT_COLORS),
  entry("Nissan", "Dualis", "Crossover/SUV", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Nissan", "Qashqai", "Crossover/SUV", ["Automatic"], ["Petrol"], "1500–2000cc", STANDARD_COLORS),
  entry("Nissan", "Murano", "Crossover/SUV", ["Automatic"], ["Petrol"], "2500–3500cc", PREMIUM_COLORS),
  entry("Nissan", "Patrol", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "4800–5600cc", RUGGED_COLORS),
  entry("Nissan", "Caravan", "Van/MPV", ["Manual", "Automatic"], ["Diesel", "Petrol"], "2000–2700cc", COMMERCIAL_COLORS),
  entry("Nissan", "NV200", "Van/MPV", ["Manual"], ["Petrol", "Diesel"], "1600–2000cc", COMMERCIAL_COLORS),
  entry("Nissan", "Serena", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "2000cc", STANDARD_COLORS),
  entry("Nissan", "Elgrand", "Van/MPV", ["Automatic"], ["Petrol"], "2500–3500cc", PREMIUM_COLORS),
  entry("Nissan", "Lafesta", "Van/MPV", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Nissan", "Navara", "Pickup", ["Manual", "Automatic"], ["Diesel"], "2500–3000cc", RUGGED_COLORS),
  entry("Nissan", "Hardbody (NP200/NP300)", "Pickup", ["Manual"], ["Petrol", "Diesel"], "1600–2500cc", RUGGED_COLORS),
  entry("Nissan", "Leaf", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Mazda ──────────────────────────────────────────────
  entry("Mazda", "Demio (Mazda 2)", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1300–1500cc", COMPACT_COLORS),
  entry("Mazda", "Axela (Mazda 3)", "Sedan", ["Automatic", "Manual"], ["Petrol", "Diesel"], "1500–2000cc", STANDARD_COLORS),
  entry("Mazda", "Atenza (Mazda 6)", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–2500cc", STANDARD_COLORS),
  entry("Mazda", "Verisa", "Hatchback", ["Automatic"], ["Petrol"], "1500cc", COMPACT_COLORS),
  entry("Mazda", "CX-3", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1500–2000cc", STANDARD_COLORS),
  entry("Mazda", "CX-5", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–2500cc", STANDARD_COLORS),
  entry("Mazda", "CX-7", "Crossover/SUV", ["Automatic"], ["Petrol"], "2300–2500cc", STANDARD_COLORS),
  entry("Mazda", "CX-8", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2200–2500cc", PREMIUM_COLORS),
  entry("Mazda", "CX-9", "Crossover/SUV", ["Automatic"], ["Petrol"], "2500cc", PREMIUM_COLORS),
  entry("Mazda", "CX-30", "Crossover/SUV", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Mazda", "Premacy", "Van/MPV", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Mazda", "Biante", "Van/MPV", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Mazda", "MPV", "Van/MPV", ["Automatic"], ["Petrol"], "2300–2500cc", STANDARD_COLORS),
  entry("Mazda", "BT-50", "Pickup", ["Manual", "Automatic"], ["Diesel"], "2200–3200cc", RUGGED_COLORS),

  // ── Subaru ──────────────────────────────────────────────
  entry("Subaru", "Impreza", "Sedan", ["Automatic", "Manual"], ["Petrol"], "1500–2000cc", STANDARD_COLORS),
  entry("Subaru", "Legacy B4", "Sedan", ["Automatic"], ["Petrol"], "2000–2500cc", STANDARD_COLORS),
  entry("Subaru", "WRX STI", "Sedan", ["Manual", "Automatic"], ["Petrol"], "2000–2500cc", ["White", "Blue", "Black", "Silver"]),
  entry("Subaru", "Legacy Touring Wagon", "Station Wagon", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Subaru", "Outback", "Station Wagon", ["Automatic"], ["Petrol"], "2000–2500cc", STANDARD_COLORS),
  entry("Subaru", "Levorg", "Station Wagon", ["Automatic"], ["Petrol"], "1600–2000cc", STANDARD_COLORS),
  entry("Subaru", "Exiga", "Station Wagon", ["Automatic"], ["Petrol"], "2000cc", STANDARD_COLORS),
  entry("Subaru", "Forester", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000–2500cc", STANDARD_COLORS),
  entry("Subaru", "XV (Crosstrek)", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "1600–2000cc", STANDARD_COLORS),

  // ── Honda ──────────────────────────────────────────────
  entry("Honda", "Fit (Jazz)", "Hatchback", ["Automatic"], ["Petrol", "Hybrid"], "1300–1500cc", COMPACT_COLORS),
  entry("Honda", "Civic", "Sedan", ["Automatic", "Manual"], ["Petrol"], "1500–1800cc", STANDARD_COLORS),
  entry("Honda", "Accord", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "2000–2400cc", STANDARD_COLORS),
  entry("Honda", "Grace", "Sedan", ["Automatic"], ["Hybrid"], "1500cc", STANDARD_COLORS),
  entry("Honda", "Insight", "Hatchback", ["Automatic"], ["Hybrid"], "1500cc", COMPACT_COLORS),
  entry("Honda", "CR-Z", "Hatchback", ["Manual", "Automatic"], ["Hybrid"], "1500cc", ["White", "Black", "Blue", "Orange"]),
  entry("Honda", "CR-V", "Crossover/SUV", ["Automatic"], ["Petrol"], "2000–2400cc", STANDARD_COLORS),
  entry("Honda", "Vezel (HR-V)", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", STANDARD_COLORS),
  entry("Honda", "Stepwgn", "Van/MPV", ["Automatic"], ["Petrol"], "1500–2000cc", STANDARD_COLORS),
  entry("Honda", "Odyssey", "Van/MPV", ["Automatic"], ["Petrol"], "2400cc", STANDARD_COLORS),
  entry("Honda", "Freed", "Van/MPV", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", COMPACT_COLORS),
  entry("Honda", "Stream", "Van/MPV", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),

  // ── Suzuki ──────────────────────────────────────────────
  entry("Suzuki", "Alto", "Hatchback", ["Manual", "Automatic"], ["Petrol"], "800–1000cc", COMPACT_COLORS),
  entry("Suzuki", "Swift", "Hatchback", ["Automatic", "Manual"], ["Petrol", "Hybrid"], "1200–1400cc", COMPACT_COLORS),
  entry("Suzuki", "Wagon R", "Hatchback", ["Automatic"], ["Petrol"], "1000cc", COMPACT_COLORS),
  entry("Suzuki", "Celerio", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000cc", COMPACT_COLORS),
  entry("Suzuki", "S-Presso", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000cc", COMPACT_COLORS),
  entry("Suzuki", "Baleno", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1200–1400cc", COMPACT_COLORS),
  entry("Suzuki", "Jimny", "Crossover/SUV", ["Manual", "Automatic"], ["Petrol"], "1500cc", RUGGED_COLORS),
  entry("Suzuki", "Grand Vitara", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1600–2400cc", RUGGED_COLORS),
  entry("Suzuki", "Vitara Brezza", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol", "Diesel"], "1500cc", STANDARD_COLORS),
  entry("Suzuki", "Ignis", "Crossover/SUV", ["Automatic"], ["Petrol"], "1200cc", COMPACT_COLORS),
  entry("Suzuki", "SX4", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1500–1600cc", STANDARD_COLORS),
  entry("Suzuki", "Ertiga", "Van/MPV", ["Automatic", "Manual"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Suzuki", "Every", "Van/MPV", ["Manual", "Automatic"], ["Petrol"], "660–1300cc", COMMERCIAL_COLORS),
  entry("Suzuki", "Carry", "Van/MPV", ["Manual"], ["Petrol"], "1000–1300cc", COMMERCIAL_COLORS),

  // ── Mitsubishi ──────────────────────────────────────────────
  entry("Mitsubishi", "Mirage", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1200cc", COMPACT_COLORS),
  entry("Mitsubishi", "Lancer", "Sedan", ["Automatic", "Manual"], ["Petrol"], "1500–2000cc", STANDARD_COLORS),
  entry("Mitsubishi", "Galant Fortis", "Sedan", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Mitsubishi", "Lancer Cargo", "Station Wagon", ["Manual"], ["Petrol"], "1500cc", COMMERCIAL_COLORS),
  entry("Mitsubishi", "Outlander", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000–2400cc", STANDARD_COLORS),
  entry("Mitsubishi", "Pajero", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol", "Diesel"], "3000–3800cc", RUGGED_COLORS),
  entry("Mitsubishi", "Pajero iO", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1800–2000cc", RUGGED_COLORS),
  entry("Mitsubishi", "Pajero Mini", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "660cc", RUGGED_COLORS),
  entry("Mitsubishi", "ASX", "Crossover/SUV", ["Automatic"], ["Petrol"], "1800–2000cc", STANDARD_COLORS),
  entry("Mitsubishi", "Eclipse Cross", "Crossover/SUV", ["Automatic"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Mitsubishi", "L200 (Triton)", "Pickup", ["Manual", "Automatic"], ["Diesel"], "2400–2500cc", RUGGED_COLORS),
  entry("Mitsubishi", "Delica Van", "Van/MPV", ["Manual", "Automatic"], ["Diesel", "Petrol"], "2000–2500cc", COMMERCIAL_COLORS),
  entry("Mitsubishi", "Canter", "Truck/Bus", ["Manual"], ["Diesel"], "3000–4200cc", COMMERCIAL_COLORS),
  entry("Mitsubishi", "Fighter", "Truck/Bus", ["Manual"], ["Diesel"], "6400–7500cc", COMMERCIAL_COLORS),

  // ── Isuzu ──────────────────────────────────────────────
  entry("Isuzu", "D-Max", "Pickup", ["Manual", "Automatic"], ["Diesel"], "2500–3000cc", RUGGED_COLORS),
  entry("Isuzu", "MU-X", "Crossover/SUV", ["Automatic"], ["Diesel"], "3000cc", RUGGED_COLORS),
  entry("Isuzu", "NKR", "Truck/Bus", ["Manual"], ["Diesel"], "3000–4300cc", COMMERCIAL_COLORS),
  entry("Isuzu", "NPR", "Truck/Bus", ["Manual"], ["Diesel"], "4300–5200cc", COMMERCIAL_COLORS),
  entry("Isuzu", "NQR", "Truck/Bus", ["Manual"], ["Diesel"], "5200cc", COMMERCIAL_COLORS),
  entry("Isuzu", "FRR", "Truck/Bus", ["Manual"], ["Diesel"], "5200–7800cc", COMMERCIAL_COLORS),
  entry("Isuzu", "FSR", "Truck/Bus", ["Manual"], ["Diesel"], "7800cc", COMMERCIAL_COLORS),
  entry("Isuzu", "FVR", "Truck/Bus", ["Manual"], ["Diesel"], "7800–9800cc", COMMERCIAL_COLORS),
  entry("Isuzu", "CYZ (Tipper)", "Truck/Bus", ["Manual"], ["Diesel"], "9800–14000cc", COMMERCIAL_COLORS),
  entry("Isuzu", "MV123 Bus", "Truck/Bus", ["Manual"], ["Diesel"], "7800cc", COMMERCIAL_COLORS),
  entry("Isuzu", "FRR Bus", "Truck/Bus", ["Manual"], ["Diesel"], "5200–7800cc", COMMERCIAL_COLORS),

  // ── BYD ──────────────────────────────────────────────
  entry("BYD", "Atto 3", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BYD", "Dolphin", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BYD", "Seal", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BYD", "E6", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Hyundai & Kia ──────────────────────────────────────────────
  entry("Hyundai", "i10", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000–1200cc", COMPACT_COLORS),
  entry("Hyundai", "i20", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1200–1400cc", COMPACT_COLORS),
  entry("Hyundai", "Elantra", "Sedan", ["Automatic"], ["Petrol"], "1600–2000cc", STANDARD_COLORS),
  entry("Hyundai", "Sonata", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "2000–2400cc", STANDARD_COLORS),
  entry("Kia", "Picanto", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000–1200cc", COMPACT_COLORS),
  entry("Kia", "Rio", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1400cc", COMPACT_COLORS),
  entry("Kia", "Cerato", "Sedan", ["Automatic"], ["Petrol"], "1600–2000cc", STANDARD_COLORS),
  entry("Kia", "Optima", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "2000–2400cc", STANDARD_COLORS),
  entry("Hyundai", "Tucson", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1600–2000cc", STANDARD_COLORS),
  entry("Hyundai", "Santa Fe", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2200–2500cc", STANDARD_COLORS),
  entry("Hyundai", "Creta", "Crossover/SUV", ["Automatic"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Kia", "Sportage", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1600–2000cc", STANDARD_COLORS),
  entry("Kia", "Sorento", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2200–2500cc", STANDARD_COLORS),
  entry("Kia", "Soul", "Crossover/SUV", ["Automatic"], ["Petrol", "Electric"], "1600cc", COMPACT_COLORS),
  entry("Hyundai", "Kona Electric", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Hyundai", "Ioniq 5", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Kia", "EV6", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Mercedes-Benz ──────────────────────────────────────────────
  entry("Mercedes-Benz", "A-Class", "Sedan", ["Automatic"], ["Petrol"], "1300–2000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "C-Class", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "1600–3000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "E-Class", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "S-Class", "Sedan", ["Automatic"], ["Petrol", "Diesel", "Hybrid"], "3000–4000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "CLA", "Sedan", ["Automatic"], ["Petrol"], "1600–2000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "CLS", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "GLA", "Crossover/SUV", ["Automatic"], ["Petrol"], "1600–2000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "GLB", "Crossover/SUV", ["Automatic"], ["Petrol"], "1600–2000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "GLC", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "GLE", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "GLS", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000cc", PREMIUM_COLORS),
  entry("Mercedes-Benz", "G-Wagon (G-Class)", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000–4000cc", RUGGED_COLORS),
  entry("Mercedes-Benz", "Actros", "Truck/Bus", ["Manual", "Automatic"], ["Diesel"], "11000–13000cc", COMMERCIAL_COLORS),
  entry("Mercedes-Benz", "Atego", "Truck/Bus", ["Manual", "Automatic"], ["Diesel"], "5100–7200cc", COMMERCIAL_COLORS),
  entry("Mercedes-Benz", "EQA", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Mercedes-Benz", "EQB", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Mercedes-Benz", "EQC", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Mercedes-Benz", "EQS", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── BMW ──────────────────────────────────────────────
  entry("BMW", "3 Series", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "1500–3000cc", PREMIUM_COLORS),
  entry("BMW", "5 Series", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("BMW", "7 Series", "Sedan", ["Automatic"], ["Petrol", "Diesel", "Hybrid"], "3000–4400cc", PREMIUM_COLORS),
  entry("BMW", "1 Series", "Hatchback", ["Automatic"], ["Petrol"], "1500–2000cc", PREMIUM_COLORS),
  entry("BMW", "4 Series Gran Coupe", "Sedan", ["Automatic"], ["Petrol"], "2000cc", PREMIUM_COLORS),
  entry("BMW", "X1", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1500–2000cc", PREMIUM_COLORS),
  entry("BMW", "X3", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000cc", PREMIUM_COLORS),
  entry("BMW", "X4", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("BMW", "X5", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000cc", PREMIUM_COLORS),
  entry("BMW", "X6", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000cc", PREMIUM_COLORS),
  entry("BMW", "X7", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000–4400cc", PREMIUM_COLORS),
  entry("BMW", "i3", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BMW", "i4", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BMW", "iX", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("BMW", "iX3", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Volkswagen ──────────────────────────────────────────────
  entry("Volkswagen", "Polo", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1000–1600cc", COMPACT_COLORS),
  entry("Volkswagen", "Golf", "Hatchback", ["Automatic", "Manual"], ["Petrol", "Diesel"], "1400–2000cc", COMPACT_COLORS),
  entry("Volkswagen", "Passat", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "1400–2000cc", STANDARD_COLORS),
  entry("Volkswagen", "Jetta", "Sedan", ["Automatic"], ["Petrol"], "1400–1800cc", STANDARD_COLORS),
  entry("Volkswagen", "T-Cross", "Crossover/SUV", ["Automatic"], ["Petrol"], "1000–1500cc", STANDARD_COLORS),
  entry("Volkswagen", "T-Roc", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1500–2000cc", STANDARD_COLORS),
  entry("Volkswagen", "Tiguan", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1400–2000cc", STANDARD_COLORS),
  entry("Volkswagen", "Touareg", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000cc", PREMIUM_COLORS),
  entry("Volkswagen", "ID.4", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Volkswagen", "ID.3", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Volkswagen", "ID.6", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Land Rover & Range Rover ──────────────────────────────────────────────
  entry("Land Rover", "Defender", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", RUGGED_COLORS),
  entry("Land Rover", "Discovery", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", RUGGED_COLORS),
  entry("Land Rover", "Discovery Sport", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000cc", RUGGED_COLORS),
  entry("Land Rover", "Range Rover Vogue", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000–5000cc", PREMIUM_COLORS),
  entry("Land Rover", "Range Rover Sport", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000–5000cc", PREMIUM_COLORS),
  entry("Land Rover", "Range Rover Velar", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Land Rover", "Range Rover Evoque", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000cc", PREMIUM_COLORS),

  // ── Ford ──────────────────────────────────────────────
  entry("Ford", "Ranger", "Pickup", ["Manual", "Automatic"], ["Diesel", "Petrol"], "2000–3200cc", RUGGED_COLORS),
  entry("Ford", "Everest", "Crossover/SUV", ["Automatic"], ["Diesel"], "2000–3200cc", RUGGED_COLORS),
  entry("Ford", "Explorer", "Crossover/SUV", ["Automatic"], ["Petrol"], "2300–3500cc", STANDARD_COLORS),
  entry("Ford", "EcoSport", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1000–1500cc", STANDARD_COLORS),

  // ── Emerging Chinese & Specialized EV Brands ──────────────────────────────────────────────
  entry("Neta", "Neta V", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("MG", "ZS EV", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("MG", "MG4 EV", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Chery", "Tiggo 4 Pro", "Crossover/SUV", ["Automatic", "Manual"], ["Petrol"], "1500cc", STANDARD_COLORS),
  entry("Chery", "Tiggo 7 Pro", "Crossover/SUV", ["Automatic"], ["Petrol"], "1500–2000cc", STANDARD_COLORS),
  entry("Chery", "Tiggo 8 Pro", "Crossover/SUV", ["Automatic"], ["Petrol"], "1600–2000cc", STANDARD_COLORS),
  entry("GWM/Haval", "Haval Jolion", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "1500cc", STANDARD_COLORS),
  entry("GWM/Haval", "Haval H6", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "1500–2000cc", STANDARD_COLORS),
  entry("GWM", "Poer", "Pickup", ["Manual", "Automatic"], ["Diesel"], "2000cc", RUGGED_COLORS),
  entry("GWM/Haval", "Ora Funky Cat", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Dongfeng", "Rich 6", "Pickup", ["Manual"], ["Diesel", "Petrol"], "2000–2400cc", RUGGED_COLORS),
  entry("Dongfeng", "Nammi Box", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Wuling", "Hongguang Mini EV", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Other European & Luxury Brands ──────────────────────────────────────────────
  entry("Audi", "A4", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "1400–2000cc", PREMIUM_COLORS),
  entry("Audi", "A6", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Audi", "Q3", "Crossover/SUV", ["Automatic"], ["Petrol"], "1400–2000cc", PREMIUM_COLORS),
  entry("Audi", "Q5", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000cc", PREMIUM_COLORS),
  entry("Audi", "Q7", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "3000cc", PREMIUM_COLORS),
  entry("Audi", "e-tron", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Porsche", "Cayenne", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel", "Hybrid"], "3000–4000cc", PREMIUM_COLORS),
  entry("Porsche", "Macan", "Crossover/SUV", ["Automatic"], ["Petrol"], "2000–3000cc", PREMIUM_COLORS),
  entry("Porsche", "Panamera", "Sedan", ["Automatic"], ["Petrol", "Hybrid"], "3000–4000cc", PREMIUM_COLORS),
  entry("Porsche", "Taycan", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Peugeot", "208", "Hatchback", ["Automatic", "Manual"], ["Petrol"], "1200cc", COMPACT_COLORS),
  entry("Peugeot", "308", "Hatchback", ["Automatic", "Manual"], ["Petrol", "Diesel"], "1200–1600cc", COMPACT_COLORS),
  entry("Peugeot", "2008", "Crossover/SUV", ["Automatic"], ["Petrol"], "1200cc", STANDARD_COLORS),
  entry("Peugeot", "3008", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1200–1600cc", STANDARD_COLORS),
  entry("Peugeot", "5008", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "1600cc", STANDARD_COLORS),
  entry("Volvo", "XC40", "Crossover/SUV", ["Automatic"], ["Petrol", "Hybrid"], "2000cc", PREMIUM_COLORS),
  entry("Volvo", "XC60", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel", "Hybrid"], "2000cc", PREMIUM_COLORS),
  entry("Volvo", "XC90", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel", "Hybrid"], "2000cc", PREMIUM_COLORS),
  entry("Volvo", "EX30", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),
  entry("Jaguar", "XF", "Sedan", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Jaguar", "F-Pace", "Crossover/SUV", ["Automatic"], ["Petrol", "Diesel"], "2000–3000cc", PREMIUM_COLORS),
  entry("Jaguar", "I-Pace", "Electric Vehicle", ["Automatic"], ["Electric"], "Electric (no engine displacement)", EV_COLORS),

  // ── Local & Mass Transit Specialists ──────────────────────────────────────────────
  entry("Mobius Motors", "Mobius II", "Crossover/SUV", ["Manual"], ["Petrol"], "1600cc", RUGGED_COLORS),
  entry("Mobius Motors", "Mobius III", "Crossover/SUV", ["Manual"], ["Petrol"], "1600cc", RUGGED_COLORS),
  entry("BasiGo", "E9", "Truck/Bus", ["Automatic"], ["Electric"], "Electric (no engine displacement)", COMMERCIAL_COLORS),
  entry("Roam", "Rapid", "Truck/Bus", ["Automatic"], ["Electric"], "Electric (no engine displacement)", COMMERCIAL_COLORS),
  entry("Mahindra", "Scorpio Pickup", "Pickup", ["Manual"], ["Diesel"], "2200cc", RUGGED_COLORS),
  entry("Mahindra", "XUV500", "Crossover/SUV", ["Manual", "Automatic"], ["Diesel"], "2200cc", STANDARD_COLORS),
  entry("Tata", "Xenon", "Pickup", ["Manual"], ["Diesel"], "2200cc", COMMERCIAL_COLORS),
  entry("Tata", "Prima", "Truck/Bus", ["Manual"], ["Diesel"], "5900–6700cc", COMMERCIAL_COLORS),
  entry("Tata", "Signa", "Truck/Bus", ["Manual"], ["Diesel"], "5900–6700cc", COMMERCIAL_COLORS),
  entry("Tata", "LPO Bus", "Truck/Bus", ["Manual"], ["Diesel"], "3800–5900cc", COMMERCIAL_COLORS),
  entry("Scania", "R-Series", "Truck/Bus", ["Manual", "Automatic"], ["Diesel"], "13000cc", COMMERCIAL_COLORS),
  entry("Scania", "G-Series", "Truck/Bus", ["Manual", "Automatic"], ["Diesel"], "9300–13000cc", COMMERCIAL_COLORS),
  entry("FAW", "Truck", "Truck/Bus", ["Manual"], ["Diesel"], "6700–9700cc", COMMERCIAL_COLORS),
  entry("IVECO", "Truck", "Truck/Bus", ["Manual"], ["Diesel"], "5900–13000cc", COMMERCIAL_COLORS),
  entry("MAN", "Truck", "Truck/Bus", ["Manual", "Automatic"], ["Diesel"], "6900–13000cc", COMMERCIAL_COLORS),
  entry("Shacman", "Truck", "Truck/Bus", ["Manual"], ["Diesel"], "9700–12000cc", COMMERCIAL_COLORS),
];

export function getMakes(): string[] {
  return Array.from(new Set(vehicleCatalog.map((v) => v.make))).sort();
}

export function getModelsForMake(make: string): VehicleCatalogEntry[] {
  return vehicleCatalog.filter((v) => v.make === make);
}

export function findCatalogEntry(make: string, model: string): VehicleCatalogEntry | undefined {
  return vehicleCatalog.find((v) => v.make === make && v.model === model);
}
