// Background photos for each page banner. null = no photo: the banner shows
// the black-and-gold background instead. Photos live in public/images/.
//
// All current photos are from Unsplash, used under the Unsplash License
// (free for commercial use; attribution not required). Recorded here so it is
// always clear where each came from:
//   home         Denice Alex          unsplash.com/photos/rlr0oaz2nZQ
//   fleet        Obi                  unsplash.com/photos/WH9tSV1nCnM
//   services     Ivan Kazlouskij      unsplash.com/photos/DszMxkyQ2Fk
//   about        Mustafa Omar         unsplash.com/photos/Zkao_QBEjk8
//   contact      Kevin Schmid         unsplash.com/photos/ldQh3wZNW5M
//   comingSoon   Rob Wingate          unsplash.com/photos/hbQgmSJpJY0
// Cropped and compressed for the web (October 2026).

export const HERO_IMAGES: Record<"home" | "fleet" | "services" | "about" | "contact" | "comingSoon" | "partner", string | null> = {
  home: "/images/hero-home.jpg",
  fleet: "/images/hero-fleet.jpg",
  services: "/images/hero-services.jpg",
  about: "/images/hero-about.jpg",
  contact: "/images/hero-contact.jpg",
  comingSoon: "/images/hero-coming-soon.jpg",
  partner: "/images/hero-coming-soon.jpg",
};

// Darkened photo backgrounds for home page sections (Unsplash License):
//   services     Jan Vlacuha          unsplash.com/photos/U4IaoKF5aj4  (cropped below the badge, softened)
//   partner      Caleb Bennetts       unsplash.com/photos/D5paKhr6c8w  (cropped above the badge)
export const SECTION_IMAGES = {
  services: "/images/section-services.jpg",
  partner: "/images/section-partner.jpg",
};

// Banner photo for each service's own page (reusing the photos above).
export const SERVICE_IMAGES: Record<string, string> = {
  "self-drive": "/images/hero-contact.jpg",
  "chauffeur-driven": "/images/hero-services.jpg",
  "driver-hire": "/images/hero-services.jpg",
  "airport-transfers": "/images/hero-about.jpg",
  "corporate-travel": "/images/hero-fleet.jpg",
  "corporate-leasing": "/images/hero-fleet.jpg",
  "insurance-replacement": "/images/section-partner.jpg",
  "vehicle-partnership": "/images/hero-coming-soon.jpg",
  "family-trips": "/images/hero-home.jpg",
  "tours-and-safaris": "/images/hero-home.jpg",
  "event-transport": "/images/hero-coming-soon.jpg",
};
