import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FLEET, FLEET_CATEGORIES, type FleetEntry } from "@/lib/fleetCatalog";
import { site } from "@/lib/site";

const DESCRIPTION =
  "The vehicles we can source in Kenya: hatchbacks, saloons, SUVs, 4WDs, people carriers, vans, pickups, safari vehicles and coaches. Tell us what you need and we'll quote it.";

export const metadata: Metadata = {
  title: "Our Fleet",
  description: DESCRIPTION,
  alternates: { canonical: "/fleet" },
  openGraph: { title: "Our Fleet", description: DESCRIPTION, url: "/fleet" },
};

function anchor(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function FleetPage() {
  const byCategory = FLEET_CATEGORIES.map((category) => ({
    category,
    vehicles: FLEET.filter((v) => v.category === category),
  })).filter((group) => group.vehicles.length > 0);

  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">Our fleet</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
            {FLEET.length} vehicles we can put you in
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            From a Vitz for town errands to a 53 seat coach, and the safari conversions in between.
            Tell us the trip and how many of you there are, and we&apos;ll come back with the
            vehicle and the price.
          </p>

          {/* Said plainly and near the top. These are models we can obtain, not
              cars sitting on a forecourt — a customer who reads this page as
              live stock and then waits a day for a Coaster has been misled by
              omission. */}
          <p className="mt-4 max-w-2xl rounded-lg bg-white/10 px-4 py-3 text-sm text-white/80">
            This is what we can source, not a live availability list. Anything ready to book right
            now is on the{" "}
            <Link href="/search" className="font-semibold text-gold underline">
              booking page
            </Link>
            . Photographs show the model, not the individual vehicle you will be given.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Tell us what you need
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

      <nav aria-label="Vehicle categories" className="border-b border-line bg-offwhite">
        <div className="container-shell flex flex-wrap gap-x-4 gap-y-2 py-4">
          {byCategory.map(({ category, vehicles }) => (
            <a
              key={category}
              href={`#${anchor(category)}`}
              className="text-sm font-medium text-midnight/70 transition hover:text-gold-dark"
            >
              {category}{" "}
              <span className="text-midnight/40">({vehicles.length})</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="container-shell py-14">
        <div className="space-y-12">
          {byCategory.map(({ category, vehicles }) => (
            <section key={category} id={anchor(category)} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-midnight">{category}</h2>
              <p className="mt-1 text-sm text-midnight/50">
                {vehicles.length} model{vehicles.length === 1 ? "" : "s"}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {vehicles.map((vehicle) => (
                  <FleetCard key={vehicle.slug} vehicle={vehicle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Can&apos;t see what you need?</h2>
          <p className="max-w-md text-sm text-white/70">
            This is what we are asked for most, not everything we can find. Describe the trip and
            we&apos;ll tell you what fits.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Request a quote
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to Us on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function FleetCard({ vehicle }: { vehicle: FleetEntry }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line">
      {vehicle.image ? (
        <Image
          src={vehicle.image}
          alt={`${vehicle.make} ${vehicle.model}`}
          width={900}
          height={600}
          className="h-36 w-full object-cover"
        />
      ) : (
        // No photograph for this model. A plain panel rather than a stand-in
        // picture of a different car: the card still says what the vehicle is,
        // and showing the wrong vehicle would be worse than showing none.
        <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-midnight to-charcoal-soft">
          <span className="px-3 text-center text-xs font-medium uppercase tracking-wide text-white/50">
            {vehicle.make}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-midnight">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="mt-1 text-xs text-midnight/60">{vehicle.seats} seats</p>

        <Link
          href={`/contact?vehicle=${encodeURIComponent(`${vehicle.make} ${vehicle.model}`)}`}
          className="mt-auto pt-3 text-xs font-semibold text-gold-dark hover:text-gold"
        >
          Request a quote &rarr;
        </Link>
      </div>
    </article>
  );
}
