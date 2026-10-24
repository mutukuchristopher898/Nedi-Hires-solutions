// The vehicle types customers browse by, in display order. Shared by the
// Our Fleet page (its sections) and the Our Fleet menu in the top bar, so
// the menu's links always land on a real section.

export const FLEET_CLASSES = [
  { classification: "Economy", title: "Economy", blurb: "Affordable, economical cars for town and everyday trips." },
  { classification: "SUV", title: "SUVs, 4x4s & Pickups", blurb: "Space and ground clearance for upcountry roads, safaris and site visits." },
  { classification: "Luxury", title: "Executive & Luxury", blurb: "Premium saloons, SUVs and people carriers for business and special occasions." },
  { classification: "Road-Trip Van", title: "Vans & People Carriers", blurb: "Room for the whole family or group, including safari vans." },
  { classification: "Bus", title: "Buses", blurb: "Minibuses and coaches for large groups and events, chauffeur driven." },
] as const;

/** The section id on /fleet for a class title, e.g. "economy", "buses". */
export function fleetAnchor(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
