import Image from "next/image";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICES } from "@/lib/services";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import { site } from "@/lib/site";
import PageHero from "@/components/PageHero";
import { HERO_IMAGES, SECTION_IMAGES } from "@/lib/heroImages";


const mainServices = SERVICES.filter((s) => s.featured);

export default async function Home() {
  // Live inventory, cheapest first, rather than a slice of the catalogue.
  const listings = await getApprovedVehicles({ limit: 12, sort: "newest" });
  const featured = listings.vehicles.slice(0, 4);

  // Only the catalogue entries that actually have a photograph: this section
  // exists to show vehicles, and a row of grey panels would defeat it. The
  // full list, photographed or not, is on /fleet.
  return (
    <div>
      <PageHero image={HERO_IMAGES.home} className="py-20 lg:py-28">
        <div className="container-shell">
          <p className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {site.tagline}
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Reliable transport, memorable travel, anywhere in Kenya.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Self drive and chauffeur driven car hire, drivers for your own vehicle, airport
            transfers, corporate leasing and safaris. Every vehicle inspected, every driver vetted.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/fleet"
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Twende, book a ride
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to us on WhatsApp
            </a>
          </div>
        </div>
      </PageHero>

      {/* The main services (featured: true in src/lib/services.ts), over a
          darkened leather-interior photo. Every other service is one click
          away under Services. */}
      <section className="relative isolate overflow-hidden bg-midnight text-white">
        <Image src={SECTION_IMAGES.services} alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight/80" />
        <div className="container-shell py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">How would you like to travel?</h2>
            <p className="mt-2 text-sm text-white/65">
              Affordable · Reliable · Comfortable, from one vetted fleet.
            </p>
          </div>
          <Link href="/services" className="text-sm font-semibold text-gold transition hover:text-white">
            See all services
          </Link>
        </div>

        <div className={`grid gap-6 ${mainServices.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {mainServices.map((s) => (
            <article
              key={s.slug}
              className="flex flex-col rounded-2xl bg-midnight/70 p-7 text-white ring-1 ring-white/10 backdrop-blur-sm sm:p-9"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                  <ServiceIcon name={s.title} className="h-7 w-7 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-gold">{s.title}</h3>
              </div>

              <p className="mt-5 text-2xl font-bold leading-snug sm:text-3xl">{s.promise}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{s.intro}</p>

              <ul className="mt-5 space-y-2">
                {s.points.slice(0, 3).map((point) => (
                  <li key={point} className="flex gap-2 text-sm text-white/80">
                    <span aria-hidden className="mt-0.5 text-gold">
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-3 pt-7">
                <Link
                  href={s.cta.href}
                  className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
                >
                  {s.cta.label}
                </Link>
                <Link
                  href={`/services/${s.slug}`}
                  className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Learn more
                </Link>
              </div>
            </article>
          ))}
        </div>

        </div>
      </section>

      <section className="container-shell py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-midnight">Featured vehicles</h2>
            </div>
            <p className="mt-1 text-sm text-midnight/60">
              Inspected, road ready and available to book now.
            </p>
          </div>
          <Link href="/fleet" className="text-sm font-semibold text-gold-dark hover:text-gold">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-line">
            <p className="text-sm text-midnight/60">
              Our fleet is being updated. Message us on WhatsApp and we&apos;ll tell you what&apos;s available.
            </p>
            <Link
              href="/list-your-vehicle/start"
              className="mt-3 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
            >
              Have a vehicle to hire out? List it &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>



      <section className="container-shell py-16">
        <div className="relative isolate grid gap-6 overflow-hidden rounded-2xl bg-midnight p-8 text-white sm:grid-cols-2 sm:items-center lg:p-14">
          <Image src={SECTION_IMAGES.partner} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight/95 via-midnight/80 to-midnight/50" />
          <div>
            <h2 className="text-2xl font-bold">Own a vehicle? Partner with us.</h2>
            <p className="mt-2 text-sm text-white/70">
              Hand your vehicle over to us. We rent it out, look after the customers and
              coordinate its upkeep, and you earn an agreed percentage of what it makes.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/partner"
              className="rounded-md bg-gold px-5 py-3 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Partner with us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
