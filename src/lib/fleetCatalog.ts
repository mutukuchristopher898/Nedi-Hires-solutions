// The vehicle types we can source, as supplied by the owner.
//
// This is deliberately NOT the bookable fleet. These are models we can obtain
// on request, not cars sitting on a forecourt with a registration and a
// logbook — so nothing here carries a price, a year or a Book button. A
// customer asks and we quote. Conflating the two is exactly the mistake the
// illustrative catalogue made before it was taken down.
//
// Photographs are representative of the model rather than of a specific
// vehicle, and 86 of the 112 have none: the card falls back to the class
// artwork, which is honest about showing a type rather than a car.

/**
 * The customer-facing vehicle classes the search page filters on, mapped from
 * the owner's own eleven categories. Approximate by design: a customer
 * narrowing to "SUV" wants a Prado and a Fortuner in the same answer, and does
 * not care that one is filed under 4WD.
 */
export const CATEGORY_CLASSIFICATION: Record<string, string> = {
  "Hatchback & Small Car": "Economy",
  Saloon: "Economy",
  "Station Wagon": "Economy",
  "Executive Saloon": "Luxury",
  "SUV & Crossover": "SUV",
  "4WD & Off-Road": "SUV",
  Pickup: "SUV",
  "MPV & People Carrier": "Road-Trip Van",
  "Van & Commercial": "Road-Trip Van",
  "Tour & Safari Vehicle": "Road-Trip Van",
  "Bus & Coach": "Bus",
};

export interface FleetEntry {
  slug: string;
  category: string;
  make: string;
  model: string;
  /** As given: sometimes a range ("7 / 8", "26 - 33"), so it stays a string. */
  seats: string;
  image?: string;
}

export const FLEET_CATEGORIES = [
  "Hatchback & Small Car",
  "Saloon",
  "Executive Saloon",
  "Station Wagon",
  "SUV & Crossover",
  "4WD & Off-Road",
  "MPV & People Carrier",
  "Van & Commercial",
  "Pickup",
  "Tour & Safari Vehicle",
  "Bus & Coach",
] as const;

/**
 * Catalogue entries matching a classification, photographed ones first.
 *
 * Shown under the bookable results on search: two vehicles in stock is a thin
 * answer to "what can I hire", and "we don't have one listed but we can get
 * you these" is both truthful and more use than an empty page.
 */
export function sourceableFor(classification?: string, limit = 8): FleetEntry[] {
  const matches = classification
    ? FLEET.filter((v) => CATEGORY_CLASSIFICATION[v.category] === classification)
    : FLEET;
  return [...matches]
    .sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)))
    .slice(0, limit);
}

export const FLEET: FleetEntry[] = [
  { slug: "toyota-vitz", category: "Hatchback & Small Car", make: "Toyota", model: "Vitz", seats: "5", image: "/fleet/toyota-vitz.jpg" },
  { slug: "toyota-passo", category: "Hatchback & Small Car", make: "Toyota", model: "Passo", seats: "5", image: "/fleet/toyota-passo.jpg" },
  { slug: "toyota-ractis", category: "Hatchback & Small Car", make: "Toyota", model: "Ractis", seats: "5", image: "/fleet/toyota-ractis.jpg" },
  { slug: "toyota-auris", category: "Hatchback & Small Car", make: "Toyota", model: "Auris", seats: "5", image: "/fleet/toyota-auris.jpg" },
  { slug: "nissan-note", category: "Hatchback & Small Car", make: "Nissan", model: "Note", seats: "5", image: "/fleet/nissan-note.jpg" },
  { slug: "mazda-demio", category: "Hatchback & Small Car", make: "Mazda", model: "Demio (Mazda 2)", seats: "5" },
  { slug: "mazda-axela", category: "Hatchback & Small Car", make: "Mazda", model: "Axela (Mazda 3)", seats: "5", image: "/fleet/mazda-axela.jpg" },
  { slug: "subaru-impreza", category: "Hatchback & Small Car", make: "Subaru", model: "Impreza", seats: "5", image: "/fleet/subaru-impreza.jpg" },
  { slug: "honda-fit", category: "Hatchback & Small Car", make: "Honda", model: "Fit (Jazz)", seats: "5", image: "/fleet/honda-fit.jpg" },
  { slug: "suzuki-alto", category: "Hatchback & Small Car", make: "Suzuki", model: "Alto", seats: "4", image: "/fleet/suzuki-alto.jpg" },
  { slug: "suzuki-swift", category: "Hatchback & Small Car", make: "Suzuki", model: "Swift", seats: "5" },
  { slug: "suzuki-wagon-r", category: "Hatchback & Small Car", make: "Suzuki", model: "Wagon R", seats: "4", image: "/fleet/suzuki-wagon-r.jpg" },
  { slug: "mercedes-benz-a-class", category: "Hatchback & Small Car", make: "Mercedes-Benz", model: "A-Class", seats: "5", image: "/fleet/mercedes-benz-a-class.jpg" },
  { slug: "volvo-v40", category: "Hatchback & Small Car", make: "Volvo", model: "V40", seats: "5", image: "/fleet/volvo-v40.jpg" },
  { slug: "bmw-1-series", category: "Hatchback & Small Car", make: "BMW", model: "1 Series", seats: "5" },
  { slug: "toyota-corolla-axio", category: "Saloon", make: "Toyota", model: "Corolla Axio", seats: "5", image: "/fleet/toyota-corolla-axio.jpg" },
  { slug: "toyota-premio", category: "Saloon", make: "Toyota", model: "Premio", seats: "5", image: "/fleet/toyota-premio.jpg" },
  { slug: "toyota-allion", category: "Saloon", make: "Toyota", model: "Allion", seats: "5", image: "/fleet/toyota-allion.jpg" },
  { slug: "toyota-belta", category: "Saloon", make: "Toyota", model: "Belta", seats: "5", image: "/fleet/toyota-belta.jpg" },
  { slug: "nissan-sylphy", category: "Saloon", make: "Nissan", model: "Sylphy", seats: "5", image: "/fleet/nissan-sylphy.jpg" },
  { slug: "nissan-bluebird-sylphy", category: "Saloon", make: "Nissan", model: "Bluebird Sylphy", seats: "5", image: "/fleet/nissan-bluebird-sylphy.jpg" },
  { slug: "mazda-atenza", category: "Saloon", make: "Mazda", model: "Atenza (Mazda 6)", seats: "5", image: "/fleet/mazda-atenza.jpg" },
  { slug: "honda-grace", category: "Saloon", make: "Honda", model: "Grace", seats: "5", image: "/fleet/honda-grace.jpg" },
  { slug: "toyota-crown", category: "Executive Saloon", make: "Toyota", model: "Crown", seats: "5" },
  { slug: "toyota-mark-x", category: "Executive Saloon", make: "Toyota", model: "Mark X", seats: "5", image: "/fleet/toyota-mark-x.jpg" },
  { slug: "toyota-camry", category: "Executive Saloon", make: "Toyota", model: "Camry", seats: "5", image: "/fleet/toyota-camry.jpg" },
  { slug: "nissan-teana", category: "Executive Saloon", make: "Nissan", model: "Teana", seats: "5", image: "/fleet/nissan-teana.jpg" },
  { slug: "mercedes-benz-c-class", category: "Executive Saloon", make: "Mercedes-Benz", model: "C-Class (C180 / C200)", seats: "5" },
  { slug: "mercedes-benz-e-class", category: "Executive Saloon", make: "Mercedes-Benz", model: "E-Class (E250 / E300)", seats: "5", image: "/fleet/mercedes-benz-e-class.jpg" },
  { slug: "mercedes-benz-s-class", category: "Executive Saloon", make: "Mercedes-Benz", model: "S-Class", seats: "5", image: "/fleet/mercedes-benz-s-class.jpg" },
  { slug: "mercedes-benz-cla", category: "Executive Saloon", make: "Mercedes-Benz", model: "CLA", seats: "5", image: "/fleet/mercedes-benz-cla.jpg" },
  { slug: "volvo-s60", category: "Executive Saloon", make: "Volvo", model: "S60", seats: "5" },
  { slug: "volvo-s90", category: "Executive Saloon", make: "Volvo", model: "S90", seats: "5" },
  { slug: "bmw-3-series", category: "Executive Saloon", make: "BMW", model: "3 Series", seats: "5" },
  { slug: "bmw-5-series", category: "Executive Saloon", make: "BMW", model: "5 Series", seats: "5" },
  { slug: "bmw-7-series", category: "Executive Saloon", make: "BMW", model: "7 Series", seats: "5" },
  { slug: "toyota-corolla-fielder", category: "Station Wagon", make: "Toyota", model: "Corolla Fielder", seats: "5" },
  { slug: "subaru-outback", category: "Station Wagon", make: "Subaru", model: "Outback", seats: "5" },
  { slug: "toyota-rav4", category: "SUV & Crossover", make: "Toyota", model: "RAV4", seats: "5" },
  { slug: "toyota-vanguard", category: "SUV & Crossover", make: "Toyota", model: "Vanguard", seats: "5 / 7" },
  { slug: "toyota-harrier", category: "SUV & Crossover", make: "Toyota", model: "Harrier", seats: "5" },
  { slug: "nissan-x-trail", category: "SUV & Crossover", make: "Nissan", model: "X-Trail", seats: "5 / 7" },
  { slug: "mazda-cx-3", category: "SUV & Crossover", make: "Mazda", model: "CX-3", seats: "5" },
  { slug: "mazda-cx-5", category: "SUV & Crossover", make: "Mazda", model: "CX-5", seats: "5" },
  { slug: "mazda-cx-7", category: "SUV & Crossover", make: "Mazda", model: "CX-7", seats: "5" },
  { slug: "mazda-cx-8", category: "SUV & Crossover", make: "Mazda", model: "CX-8", seats: "7" },
  { slug: "mazda-cx-30", category: "SUV & Crossover", make: "Mazda", model: "CX-30", seats: "5" },
  { slug: "subaru-forester", category: "SUV & Crossover", make: "Subaru", model: "Forester", seats: "5" },
  { slug: "subaru-xv", category: "SUV & Crossover", make: "Subaru", model: "XV (Crosstrek)", seats: "5" },
  { slug: "honda-vezel", category: "SUV & Crossover", make: "Honda", model: "Vezel (HR-V)", seats: "5" },
  { slug: "mercedes-benz-gla", category: "SUV & Crossover", make: "Mercedes-Benz", model: "GLA", seats: "5" },
  { slug: "mercedes-benz-glc", category: "SUV & Crossover", make: "Mercedes-Benz", model: "GLC", seats: "5" },
  { slug: "mercedes-benz-gle", category: "SUV & Crossover", make: "Mercedes-Benz", model: "GLE (formerly ML)", seats: "5 / 7" },
  { slug: "mercedes-benz-gls", category: "SUV & Crossover", make: "Mercedes-Benz", model: "GLS", seats: "7" },
  { slug: "volvo-xc40", category: "SUV & Crossover", make: "Volvo", model: "XC40", seats: "5" },
  { slug: "volvo-xc60", category: "SUV & Crossover", make: "Volvo", model: "XC60", seats: "5" },
  { slug: "volvo-xc90", category: "SUV & Crossover", make: "Volvo", model: "XC90", seats: "7" },
  { slug: "bmw-x1", category: "SUV & Crossover", make: "BMW", model: "X1", seats: "5" },
  { slug: "bmw-x3", category: "SUV & Crossover", make: "BMW", model: "X3", seats: "5" },
  { slug: "bmw-x5", category: "SUV & Crossover", make: "BMW", model: "X5", seats: "5 / 7" },
  { slug: "bmw-x6", category: "SUV & Crossover", make: "BMW", model: "X6", seats: "5" },
  { slug: "bmw-x7", category: "SUV & Crossover", make: "BMW", model: "X7", seats: "7" },
  { slug: "toyota-fortuner", category: "4WD & Off-Road", make: "Toyota", model: "Fortuner", seats: "7" },
  { slug: "toyota-land-cruiser-prado", category: "4WD & Off-Road", make: "Toyota", model: "Land Cruiser Prado (J150)", seats: "7" },
  { slug: "toyota-land-cruiser-v8", category: "4WD & Off-Road", make: "Toyota", model: "Land Cruiser V8 (LC200)", seats: "7 / 8" },
  { slug: "nissan-patrol", category: "4WD & Off-Road", make: "Nissan", model: "Patrol", seats: "7" },
  { slug: "mercedes-benz-g-class", category: "4WD & Off-Road", make: "Mercedes-Benz", model: "G-Class (G-Wagon)", seats: "5" },
  { slug: "toyota-noah", category: "MPV & People Carrier", make: "Toyota", model: "Noah", seats: "7 / 8" },
  { slug: "toyota-voxy", category: "MPV & People Carrier", make: "Toyota", model: "Voxy", seats: "7 / 8" },
  { slug: "toyota-sienta", category: "MPV & People Carrier", make: "Toyota", model: "Sienta", seats: "6 / 7" },
  { slug: "toyota-alphard", category: "MPV & People Carrier", make: "Toyota", model: "Alphard", seats: "7 / 8" },
  { slug: "toyota-vellfire", category: "MPV & People Carrier", make: "Toyota", model: "Vellfire", seats: "7 / 8" },
  { slug: "nissan-serena", category: "MPV & People Carrier", make: "Nissan", model: "Serena", seats: "7 / 8" },
  { slug: "honda-stepwgn", category: "MPV & People Carrier", make: "Honda", model: "Stepwgn", seats: "7 / 8" },
  { slug: "mercedes-benz-v-class", category: "MPV & People Carrier", make: "Mercedes-Benz", model: "V-Class", seats: "7 / 8" },
  { slug: "toyota-probox", category: "Van & Commercial", make: "Toyota", model: "Probox", seats: "2 / 5" },
  { slug: "toyota-succeed", category: "Van & Commercial", make: "Toyota", model: "Succeed", seats: "2 / 5" },
  { slug: "toyota-hiace", category: "Van & Commercial", make: "Toyota", model: "Hiace", seats: "9 - 14" },
  { slug: "nissan-caravan", category: "Van & Commercial", make: "Nissan", model: "Caravan (Urvan)", seats: "9 - 14" },
  { slug: "nissan-nv200", category: "Van & Commercial", make: "Nissan", model: "NV200", seats: "5 / 7" },
  { slug: "mercedes-benz-vito", category: "Van & Commercial", make: "Mercedes-Benz", model: "Vito", seats: "8 / 9" },
  { slug: "toyota-hilux", category: "Pickup", make: "Toyota", model: "Hilux", seats: "2 / 5" },
  { slug: "toyota-land-cruiser-pickup", category: "Pickup", make: "Toyota", model: "Land Cruiser Pickup (LC79)", seats: "2 / 5" },
  { slug: "nissan-navara", category: "Pickup", make: "Nissan", model: "Navara", seats: "5" },
  { slug: "isuzu-d-max", category: "Pickup", make: "Isuzu", model: "D-Max", seats: "2 / 5" },
  { slug: "toyota-land-cruiser-78-series-safari-van", category: "Tour & Safari Vehicle", make: "Toyota", model: "Land Cruiser 78 Series Safari Van (pop-up roof)", seats: "7 - 9" },
  { slug: "toyota-land-cruiser-76-series-hardtop", category: "Tour & Safari Vehicle", make: "Toyota", model: "Land Cruiser 76 Series Hardtop", seats: "5 - 7" },
  { slug: "toyota-land-cruiser-79-double-cab", category: "Tour & Safari Vehicle", make: "Toyota", model: "Land Cruiser 79 Double Cab", seats: "5" },
  { slug: "toyota-land-cruiser-105-gx", category: "Tour & Safari Vehicle", make: "Toyota", model: "Land Cruiser 105 / GX (safari spec)", seats: "7 - 8" },
  { slug: "toyota-land-cruiser-prado-tx-4x4", category: "Tour & Safari Vehicle", make: "Toyota", model: "Land Cruiser Prado TX 4x4 (safari spec)", seats: "7" },
  { slug: "toyota-hiace-tour-van", category: "Tour & Safari Vehicle", make: "Toyota", model: "Hiace Tour Van (pop-up roof)", seats: "7 - 9" },
  { slug: "toyota-hiace-super-custom-grandia", category: "Tour & Safari Vehicle", make: "Toyota", model: "Hiace Super Custom / Grandia", seats: "9 - 11" },
  { slug: "nissan-urvan-tour-van", category: "Tour & Safari Vehicle", make: "Nissan", model: "Urvan Tour Van (pop-up roof)", seats: "7 - 9" },
  { slug: "mitsubishi-pajero", category: "Tour & Safari Vehicle", make: "Mitsubishi", model: "Pajero", seats: "7" },
  { slug: "land-rover-defender-110", category: "Tour & Safari Vehicle", make: "Land Rover", model: "Defender 110", seats: "5 - 7" },
  { slug: "toyota-coaster", category: "Bus & Coach", make: "Toyota", model: "Coaster (standard)", seats: "22 - 26" },
  { slug: "toyota-coaster", category: "Bus & Coach", make: "Toyota", model: "Coaster (long / high roof)", seats: "29 - 33" },
  { slug: "mitsubishi-rosa", category: "Bus & Coach", make: "Mitsubishi", model: "Rosa", seats: "26 - 33" },
  { slug: "nissan-civilian", category: "Bus & Coach", make: "Nissan", model: "Civilian", seats: "26 - 30" },
  { slug: "isuzu-npr", category: "Bus & Coach", make: "Isuzu", model: "NPR", seats: "26 - 33" },
  { slug: "isuzu-nqr", category: "Bus & Coach", make: "Isuzu", model: "NQR", seats: "33 - 37" },
  { slug: "isuzu-frr", category: "Bus & Coach", make: "Isuzu", model: "FRR", seats: "51" },
  { slug: "hino-liesse", category: "Bus & Coach", make: "Hino", model: "Liesse", seats: "26 - 29" },
  { slug: "hino-ak-fc", category: "Bus & Coach", make: "Hino", model: "AK / FC (body-built)", seats: "44 - 51" },
  { slug: "mercedes-benz-sprinter-minibus", category: "Bus & Coach", make: "Mercedes-Benz", model: "Sprinter Minibus", seats: "14 - 19" },
  { slug: "mercedes-benz-tourismo-coach", category: "Bus & Coach", make: "Mercedes-Benz", model: "Tourismo Coach", seats: "49 - 53" },
  { slug: "volvo-b8r-b9r-coach", category: "Bus & Coach", make: "Volvo", model: "B8R / B9R Coach", seats: "49 - 59" },
  { slug: "volvo-9700-coach", category: "Bus & Coach", make: "Volvo", model: "9700 Coach", seats: "49 - 53" },
  { slug: "scania-marcopolo-irizar-coach", category: "Bus & Coach", make: "Scania", model: "Marcopolo / Irizar Coach", seats: "49 - 59" },
  { slug: "higer-klq-coach", category: "Bus & Coach", make: "Higer", model: "KLQ Coach", seats: "33 - 51" },
  { slug: "yutong-zk-coach", category: "Bus & Coach", make: "Yutong", model: "ZK Coach", seats: "35 - 53" },
  { slug: "king-long-xmq-coach", category: "Bus & Coach", make: "King Long", model: "XMQ Coach", seats: "33 - 49" },
];
