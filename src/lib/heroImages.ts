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
