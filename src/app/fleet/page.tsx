import type { Metadata } from "next";
import VehicleCard from "@/components/VehicleCard";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import { site } from "@/lib/site";
import PageHero from "@/components/PageHero";
import { HERO_IMAGES } from "@/lib/heroImages";

// The fleet page lists the bookable fleet from the database: every vehicle
// an admin has approved, grouped by class, each with its price and
// description. (It used to show a hard-coded catalogue of models that could
// be sourced; that was retired in October 2026 at the owner's request.)

const DESCRIPTION =
  "Hire economy cars, executive and luxury saloons, SUVs and 4x4s, vans and coaches in Kenya. Self drive or chauffeur driven, with daily prices shown.";

export const metadata: Metadata = {
  title: "Our Fleet",
  description: DESCRIPTION,
  alternates: { canonical: "/fleet" },
  openGraph: { images: [site.ogImage], title: "Our Fleet", description: DESCRIPTION, url: "/fleet" },
};

const CLASSES = [
  { classification: "Economy", title: "Economy", blurb: "Affordable, economical cars for town and everyday trips." },
  { classification: "Luxury", title: "Executive & Luxury", blurb: "Premium saloons, SUVs and people carriers for business and special occasions." },
  { classification: "SUV", title: "SUVs, 4x4s & Pickups", blurb: "Space and ground clearance for upcountry roads, safaris and site visits." },
  { classification: "Road-Trip Van", title: "Vans & People Carriers", blurb: "Room for the whole family or group, including safari vans." },
  { classification: "Bus", title: "Buses", blurb: "Minibuses and coaches for large groups and events, chauffeur driven." },
] as const;

function anchor(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function FleetPage() {
  // One query per class: each stays well inside the per-query result cap,
  // and the page reads in the order customers think in.
  const groups = (
    await Promise.all(
      CLASSES.map(async (c) => ({
        ...c,
        vehicles: (await getApprovedVehicles({ classification: c.classification, sort: "price_asc", limit: 48 })).vehicles,
      })),
    )
  ).filter((g) => g.vehicles.length > 0);

  const total = groups.reduce((sum, g) => sum + g.vehicles.length, 0);

  return (
    <div>
      <PageHero image={HERO_IMAGES.fleet} className="py-16">
        <div className="container-shell">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            {total > 0 ? `${total} vehicles ready to book` : "Our fleet"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            From a Vitz for town errands to a coach for the whole group. Self drive or chauffeur
            driven, with the daily price on every vehicle.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to Us on WhatsApp
            </a>
          </div>
        </div>
      </PageHero>

      {groups.length > 1 && (
        <nav aria-label="Vehicle classes" className="border-b border-line bg-sand">
          <div className="container-shell flex flex-wrap gap-x-5 gap-y-2 py-4">
            {groups.map((g) => (
              <a
                key={g.classification}
                href={`#${anchor(g.title)}`}
                className="text-sm font-medium text-midnight/70 transition hover:text-gold-dark"
              >
                {g.title} <span className="text-midnight/40">({g.vehicles.length})</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {groups.length === 0 ? (
        <section className="container-shell py-16">
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-line">
            <p className="text-sm text-midnight/60">
              Our fleet is being updated. Message us on WhatsApp and we&apos;ll tell you what&apos;s available.
            </p>
          </div>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.classification} id={anchor(g.title)} className="container-shell scroll-mt-24 py-12">
            <div className="mb-6">
              <span aria-hidden="true" className="mb-3 block h-1 w-10 rounded-full bg-terracotta" />
              <h2 className="text-2xl font-bold text-midnight">{g.title}</h2>
              <p className="mt-1 text-sm text-midnight/60">{g.blurb}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {g.vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} showDescription />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
