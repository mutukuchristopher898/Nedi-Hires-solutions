// The seven services, in one place.
//
// The homepage cards and the /services page were drifting apart — the homepage
// had a one-line summary and the detail lived nowhere — so both now read from
// here. `title` matches the keys in ServiceIcon, which is load-bearing: a
// renamed title silently loses its icon.
//
// On the claims in this copy: "inspected before every hire", "background
// checked" and fixed pricing are operational promises the business has
// confirmed it actually keeps. They are worth keeping honest — if a process
// stops, the words here have to change with it.

export interface Service {
  slug: string;
  /** Must match a key in ServiceIcon. */
  title: string;
  /** The short line on the homepage card. */
  summary: string;
  /** The bold promise at the top of the services entry. */
  promise: string;
  intro: string;
  points: string[];
  bestFor: string;
  cta: { label: string; href: string };
}

export const SERVICES: Service[] = [
  {
    slug: "self-drive",
    title: "Self Drive",
    summary: "Rent the keys and go. Full tank, well maintained vehicles for independent travel.",
    promise: "Rent the keys and go.",
    intro:
      "You know where you're going. We hand you a clean, full tank vehicle and get out of the way.",
    points: [
      "Full tank at pickup, serviced and inspected before every hire",
      "Daily, weekly and monthly rates. Longer bookings cost less per day",
      "Valid driving licence and ID verification required",
      "Nationwide delivery, or collect from us",
    ],
    bestFor:
      "residents, returning visitors, and anyone who'd rather set their own schedule.",
    cta: { label: "Check availability", href: "/search" },
  },
  {
    slug: "chauffeur-driven",
    title: "Chauffeur Driven",
    summary: "Sit back with a vetted professional driver for airport runs or full day hire.",
    promise: "Sit back. Someone else handles the traffic.",
    intro:
      "A vetted professional driver who knows the roads, the shortcuts, and when to stay quiet.",
    points: [
      "Half day, full day and multi day hire",
      "Drivers background checked and route experienced",
      "Fuel and driver allowance included in the quoted rate",
      "Airport runs, meetings, city errands, upcountry trips",
    ],
    bestFor:
      "visitors unfamiliar with Kenyan roads, executives between meetings, anyone who'd rather not park in town.",
    cta: { label: "Request a driver", href: "/contact" },
  },
  {
    slug: "airport-transfers",
    title: "Airport Transfers",
    summary: "Meet & greet pickups and drop offs at JKIA, Moi International, and regional airports.",
    promise: "We'll be there before you land.",
    intro:
      "Meet and greet pickups at JKIA, Moi International, Wilson and regional airstrips, with your name on a board and your flight tracked.",
    points: [
      "Flight monitoring, so delays don't cost you the ride",
      "Fixed pricing quoted upfront, no surge, no meter",
      "Luggage appropriate vehicles matched to your group size",
      "Late night and early morning arrivals covered",
    ],
    bestFor:
      "first time arrivals, business travellers on tight connections, families with luggage.",
    cta: { label: "Book a transfer", href: "/contact" },
  },
  {
    slug: "corporate-travel",
    title: "Corporate Travel",
    summary: "Vetted executive fleets and structured mobility arrangements for businesses.",
    promise: "Mobility your finance team can actually reconcile.",
    intro:
      "Structured arrangements for companies that move people regularly, with the paperwork to match.",
    points: [
      "Monthly invoicing and consolidated statements",
      "Dedicated account manager and priority dispatch",
      "Executive sedans through to staff shuttles",
      "Negotiated rates on committed volume",
    ],
    bestFor:
      "organisations with recurring staff movement, visiting delegations, or ongoing project transport.",
    cta: { label: "Talk to our corporate team", href: "/contact" },
  },
  {
    slug: "family-trips",
    title: "Family Trips",
    summary: "Spacious vans and SUVs built for family road trips and group outings.",
    promise: "Room for everyone, and everything.",
    intro:
      "Spacious vans and SUVs built for the trips where someone always forgets something.",
    points: [
      "7, 9 and 14 seater options",
      "Child seats available on request",
      "Coast runs, upcountry visits, weekend getaways",
      "Self drive or with a driver, your call",
    ],
    // "Shags" kept: the primary market here is domestic, and it is the word a
    // Kenyan customer would actually use for the trip being described.
    bestFor: "school holidays, family reunions, and the annual drive to shags.",
    cta: { label: "Plan a family trip", href: "/contact" },
  },
  {
    slug: "tours-and-safaris",
    title: "Tours & Safaris",
    summary: "Purpose built 4x4s with pop up roofs for game drives and coastal excursions.",
    promise: "Built for the road that isn't a road.",
    intro:
      "Purpose built 4x4s with pop up roofs, driven by guides who know which gate to use and when the light is right.",
    points: [
      "Landcruisers and safari vans with pop up viewing roofs",
      "Park experienced driver guides",
      "Maasai Mara, Amboseli, Tsavo, Samburu, Diani and the coast",
      "Multi day itineraries arranged end to end",
    ],
    bestFor:
      "game drives, coastal excursions, and visitors with one shot at getting the photo.",
    cta: { label: "Plan a safari", href: "/contact" },
  },
  {
    slug: "event-transport",
    title: "Event Transport",
    summary: "Bulk and high capacity transit for weddings, conferences, and group events.",
    promise: "Move a hundred people without moving a hundred times.",
    intro: "Bulk and high capacity transit, coordinated as one booking.",
    points: [
      "Fleets from 3 to 30+ vehicles",
      "Single point of contact on the day",
      "Timed arrivals and departures, planned in advance",
      "Weddings, conferences, team offsites, church events",
    ],
    bestFor:
      "anyone whose event succeeds or fails on whether people arrive together.",
    cta: { label: "Get an event quote", href: "/contact" },
  },
];
