import Image from "next/image";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICES } from "@/lib/services";
import { FLEET } from "@/lib/fleetCatalog";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import { site } from "@/lib/site";


export default async function Home() {
  // Live inventory, cheapest first, rather than a slice of the catalogue.
  const listings = await getApprovedVehicles({ limit: 12, sort: "newest" });
  const featured = listings.vehicles.slice(0, 4);

  // Only the catalogue entries that actually have a photograph: this section
  // exists to show vehicles, and a row of grey panels would defeat it. The
  // full list, photographed or not, is on /fleet.
  const showcase = FLEET.filter((v) => v.image).slice(0, 8);
  return (
    <div>
      <section className="relative overflow-hidden bg-midnight">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-charcoal to-charcoal-soft" />
        {/* Two warm glows for depth. The second was emerald, which read as a teal
            accent against the old navy but goes olive against warm charcoal. */}
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(182,130,53,0.28),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(143,101,39,0.22),transparent_40%)]" />

        <div className="container-shell relative py-20 lg:py-28">
          <p className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {site.tagline}
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Reliable transport, memorable travel, anywhere in Kenya.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Self drive or chauffeur driven car hire, airport transfers, corporate travel,
            and tours &amp; safaris. Every vehicle inspected, every driver vetted.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Twende, Book a Ride
            </Link>
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
      </section>

      <section className="container-shell py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-midnight">Our Services</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Affordable · Reliable · Comfortable, one platform for every kind of trip.
            </p>
          </div>
          <Link href="/services" className="text-sm font-semibold text-gold-dark hover:text-gold">
            All seven services →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.filter((s) => s.featured).map((s) => (
            <Link
              key={s.slug}
              href={`/services#${s.slug}`}
              className="rounded-xl bg-white p-5 ring-1 ring-line transition hover:ring-gold"
            >
              <ServiceIcon name={s.title} className="h-9 w-9 text-gold" />
              <h3 className="mt-3 font-semibold text-midnight">{s.title}</h3>
              <p className="mt-2 text-sm text-midnight/60">{s.summary}</p>
            </Link>
          ))}
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
          <Link href="/search" className="text-sm font-semibold text-gold-dark hover:text-gold">
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center ring-1 ring-line">
            <p className="text-sm text-midnight/60">
              Nothing is listed for these dates yet. Message us on WhatsApp and we&apos;ll tell you what we can source.
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


      {showcase.length > 0 && (
        <section className="bg-offwhite py-14">
          <div className="container-shell">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-midnight">Our fleet</h2>
                {/* The distinction is load bearing and goes in the subheading
                    rather than the small print: the section above is what can
                    be booked now, this is what can be found. */}
                <p className="mt-1 max-w-xl text-sm text-midnight/60">
                  {FLEET.length} models we can source across Kenya, from town runabouts to 53 seat
                  coaches. Not a live availability list, tell us the trip and we&apos;ll quote it.
                </p>
              </div>
              <Link href="/fleet" className="text-sm font-semibold text-gold-dark hover:text-gold">
                See all {FLEET.length} &rarr;
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map((v) => (
                <Link
                  key={v.slug}
                  href={`/fleet#${v.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
                  className="group overflow-hidden rounded-xl bg-white ring-1 ring-line transition hover:ring-gold"
                >
                  <Image
                    src={v.image!}
                    alt={`${v.make} ${v.model}`}
                    width={900}
                    height={600}
                    className="h-36 w-full object-cover transition group-hover:opacity-90"
                  />
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-midnight">
                      {v.make} {v.model}
                    </h3>
                    <p className="mt-1 text-xs text-midnight/60">
                      {v.seats} seats &middot; {v.category}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-shell py-16">
        <div className="grid gap-6 rounded-2xl bg-midnight p-8 text-white sm:grid-cols-2 sm:items-center lg:p-12">
          <div>
            <h2 className="text-2xl font-bold">Own a vehicle? Put it to work.</h2>
            {/* The route is still /list-your-vehicle/start and the word is
                deliberately absent from the copy: customers are not shown a
                two tier fleet, so nothing here should hint at one. */}
            <p className="mt-2 text-sm text-white/70">
              Tell us about your vehicle and we&apos;ll put it in front of customers. Every
              submission is checked, and its paperwork reviewed, before it goes live.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/list-your-vehicle/start"
              className="rounded-md bg-emerald px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-dark"
            >
              List Your Vehicle
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
