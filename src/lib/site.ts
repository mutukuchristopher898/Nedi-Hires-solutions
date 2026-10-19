export const site = {
  name: "Nedi Hires Solutions",
  // Canonical origin, used for metadataBase, the sitemap and robots. Change
  // this the day a custom domain is pointed at the site.
  url: "https://nedisolutions.com",
  tagline: "Drive. Explore. Experience.",
  description:
    "Car hire in Nairobi and across Kenya: self drive and chauffeur driven cars, drivers for your own vehicle, corporate fleet leasing, insurance replacement vehicles, airport transfers and safaris.",
  phoneDisplay: "0113 624 058",
  phoneTel: "+254113624058",
  whatsappHref: "https://wa.me/254113624058",
  email: "info@nedisolutions.com",
  location: "Nairobi, Kenya",
  // Social profiles, shown in the footer and on the contact page, and given
  // to search engines as the business's official accounts. Add Facebook and
  // Instagram here once they exist: { name: "Instagram", href: "https://..." }.
  socials: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/nedi-hires-solutions/" },
    { name: "X", href: "https://x.com/nedi_hires_" },
    { name: "TikTok", href: "https://www.tiktok.com/@nedi_hires_solutions" },
  ] as { name: string; href: string }[],
  // The picture shown when a page is shared (WhatsApp, LinkedIn, X, Facebook).
  // A page that sets its own openGraph must include this, or it loses the
  // picture: Next.js replaces the whole openGraph object rather than merging.
  ogImage: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Nedi Hires Solutions: car hire, drivers and fleet leasing across Kenya" },
  // The X username, for link previews when the site is shared on X.
  xHandle: "@nedi_hires_",
};
