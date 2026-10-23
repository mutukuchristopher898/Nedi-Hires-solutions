import Image from "next/image";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import ServiceIcon from "@/components/ServiceIcon";
import PageHero from "@/components/PageHero";
import { SERVICES } from "@/lib/services";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import { HERO_IMAGES, SECTION_IMAGES } from "@/lib/heroImages";
import type { VehicleListing } from "@/lib/types";

// Home page, four sections, each over a photo:
//   1. Banner: two photos cross-fading, one button.
//   2. The three main services (featured: true in src/lib/services.ts).
//   3. Four vehicles, one from each of the main classes.
//   4. Vehicle partnership, full width.
// Headings pair the bold sans-serif with a gold italic serif accent (the
// logo's typeface), via <Accent>.

const mainServices = SERVICES.filter((s) => s.featured);

// One vehicle from each of these, in this order. Buses are left out: they are
// mostly booked for groups through a quote.
const SHOWCASE_CLASSES = ["Economy", "SUV", "Luxury", "Road-Trip Van"] as const;

function Accent({ children }: { children: React.ReactNode }) {
  return <em className="font-serif font-medium italic text-gold">{children}</em>;
}

export default async function Home() {
  const showcase = (
    await Promise.all(
      SHOWCASE_CLASSES.map(async (classification) => {
        try {
          const page = await getApprovedVehicles({ classification, sort: "newest", limit: 1 });
          return page.vehicles[0] ?? null;
        } catch {
          return null;
        }
      }),
    )
  ).filter((v): v is VehicleListing => v !== null);

  return (
    <div>
      {/* 1. Banner */}
      <PageHero images={[HERO_IMAGES.home!, HERO_IMAGES.comingSoon!]} className="py-24 lg:py-36">
        <div className="container-shell">
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] text-white sm:text-6xl">
            Every journey across <Accent>East Africa</Accent> starts here
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">
            Self drive and chauffeur driven car hire, drivers for your own vehicle, airport
            transfers, corporate leasing and safaris. Every vehicle inspected, every driver vetted.
          </p>
          <Link
            href="/fleet"
            className="mt-10 inline-block rounded-md bg-gold px-8 py-4 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Start your journey
          </Link>
        </div>
      </PageHero>

      {/* 2. Main services, over the darkened leather-seats photo */}
      <section className="relative isolate overflow-hidden bg-midnight text-white">
        <Image src={SECTION_IMAGES.services} alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight/80" />
        <div className="container-shell py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How would you like to <Accent>travel</Accent>?
            </h2>
            <Link href="/services" className="text-sm font-semibold text-gold transition hover:text-white">
              See all services
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {mainServices.map((s) => (
              <article
                key={s.slug}
                className="flex flex-col rounded-2xl bg-midnight/70 p-7 text-white ring-1 ring-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60">
                    <ServiceIcon name={s.title} className="h-5 w-5 text-gold" />
                  </span>
                  <h3 className="text-lg font-semibold text-sand">{s.title}</h3>
                </div>
                <p className="mt-5 text-xl font-bold leading-snug">{s.promise}</p>
                <ul className="mt-5 space-y-2">
                  {s.points.slice(0, 3).map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-white/75">
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
                    className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
                  >
                    {s.cta.label}
                  </Link>
                  <Link
                    href={`/services/${s.slug}`}
                    className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Learn more
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Four vehicles, over the darkened row-of-cars photo */}
      <section className="relative isolate overflow-hidden bg-midnight">
        <Image src={HERO_IMAGES.fleet!} alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight/85" />
        <div className="container-shell py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready when <Accent>you are</Accent>
              </h2>
              <p className="mt-2 text-sm text-white/65">Inspected, road ready and available to book.</p>
            </div>
            <Link href="/fleet" className="text-sm font-semibold text-gold transition hover:text-white">
              View the full fleet
            </Link>
          </div>

          {showcase.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 p-8 text-center text-sm text-white/70 ring-1 ring-white/10">
              Our fleet is being updated. Message us on WhatsApp and we&apos;ll tell you what&apos;s available.
            </div>
          )}
        </div>
      </section>

      {/* 4. Vehicle partnership, full width, over the black SUV photo */}
      <section className="relative isolate overflow-hidden bg-midnight text-white">
        <Image src={SECTION_IMAGES.partner} alt="" fill sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight/95 via-midnight/80 to-midnight/40" />
        <div className="container-shell grid gap-8 py-24 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Own a vehicle? Let it <Accent>earn for you</Accent>.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Hand your vehicle over to us. We rent it out, look after the customers and
              coordinate its upkeep, and you earn an agreed percentage of what it makes.
            </p>
          </div>
          <div className="md:justify-self-end">
            <Link
              href="/partner"
              className="inline-block rounded-md bg-gold px-8 py-4 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Start earning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
