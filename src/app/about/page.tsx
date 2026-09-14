import type { Metadata } from "next";
import Link from "next/link";
import { LogoLockup } from "@/components/Logo";
import { site } from "@/lib/site";
import { getPublicFleetStats } from "@/lib/supabase/queries";

const DESCRIPTION =
  "Nedi Hires Solutions is a Kenyan transport and car hire company. Every vehicle comes from a vetted partner operator, held to one inspection standard and one verification workflow.";

export const metadata: Metadata = {
  title: "About Us",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: "About Us", description: DESCRIPTION, url: "/about" },
};

const VALUES = [
  {
    title: "Affordable",
    copy: "Our pricing is quoted upfront and doesn't move. No surge, no surprise fuel charges, no mysterious line items at handover.",
  },
  {
    title: "Reliable",
    copy: "A vehicle that arrives late is a vehicle that failed. We track flights, plan routes around Nairobi traffic, and build buffer into every schedule.",
  },
  {
    title: "Comfortable",
    copy: "Clean interiors, working air conditioning, and enough room for your luggage. Basic things, done consistently.",
  },
];

const PIPELINE = [
  {
    step: "01",
    title: "Reservation & Deposit",
    copy: "Choose your dates and pay a reservation deposit online. The deposit holds your vehicle so it isn't double booked, and it confirms to the owner that the booking is real.",
  },
  {
    step: "02",
    title: "Identity Verification",
    copy: "Upload a passport, driver's licence or national ID. Our team and the vehicle partner review it before the vehicle is released. This is why the cars on our platform don't disappear.",
  },
  {
    step: "03",
    title: "Final Settlement",
    copy: "Once you're verified, settle the balance online or at handover, whichever suits you. No cash pressure at pickup.",
  },
];

export default async function AboutPage() {
  const stats = await getPublicFleetStats();

  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell grid gap-8 lg:grid-cols-[1.3fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gold">About Us</p>
            <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">
              Getting people where they&apos;re going, safely and on time
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/70">
              {site.name} is a Kenyan transport and car hire company. We do the unglamorous part
              well: the car is clean, the driver shows up, the price is what we said it would be.
            </p>
            <p className="mt-3 max-w-lg text-sm text-white/50">
              That sounds like a low bar. In this market, it isn&apos;t.
            </p>
          </div>
          <div className="hidden justify-self-center sm:block">
            <LogoLockup light width={340} priority />
          </div>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-bold text-midnight">What we do</h2>
            <p className="mt-3 text-sm leading-relaxed text-midnight/70">
              We run a single booking platform across seven services: self drive hire,
              chauffeur driven trips, airport transfers, corporate travel, family trips, tours and
              safaris, and event transport.
            </p>
            {/* Corrected from an earlier version claiming a small internal fleet.
                There has never been one: every vehicle on the platform belongs
                to a partner operator, and saying so plainly is a better story
                than implying otherwise. */}
            <p className="mt-3 text-sm leading-relaxed text-midnight/70">
              Every vehicle on the platform belongs to a partner operator we have vetted and work
              with directly: established fleets, tour operators and private hosts. We don&apos;t
              keep a fleet of our own, and that is deliberate: it means we can be honest about
              holding every operator to the same standard rather than grading our own homework.
              From your side the arrangement doesn&apos;t change anything. Every vehicle meets the
              same inspection standard, every driver passes the same background check, you book
              once, and you hold one company accountable.
            </p>
            <Link
              href="/services"
              className="mt-4 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
            >
              See all seven services →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Stat value={stats.vehicles} label={stats.vehicles === 1 ? "Vehicle available" : "Vehicles available"} />
            <Stat value={stats.operators} label={stats.operators === 1 ? "Partner operator" : "Partner operators"} />
            <Stat value={stats.locations} label={stats.locations === 1 ? "Pickup location" : "Pickup locations"} />
            {/* Deliberately no trip counter and no "X+ vehicles" claim: these
                three are read from the database and are true whenever the page
                renders. A rounded up number nobody can check would undo the
                point of the section. */}
          </div>
        </div>
      </section>

      <section className="bg-charcoal py-14 text-white">
        <div className="container-shell">
          <h2 className="text-2xl font-bold">What we believe</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <h3 className="font-semibold text-gold">{v.title}</h3>
                <p className="mt-2 text-sm text-white/70">{v.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14">
        <h2 className="text-2xl font-bold text-midnight">
          <span className="italic text-gold-dark">Safiri salama</span>: the part most companies
          skip
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-midnight/70">
          Handing a stranger a car is a serious thing. So is handing a stranger your money. Our
          booking pipeline is built so neither side has to simply trust the other.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PIPELINE.map((s) => (
            <div key={s.step} className="rounded-xl bg-white p-5 ring-1 ring-line">
              <span className="text-sm font-semibold text-gold-dark">{s.step}</span>
              <h3 className="mt-2 font-semibold text-midnight">{s.title}</h3>
              <p className="mt-2 text-sm text-midnight/60">{s.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-offwhite p-6">
          <h3 className="font-semibold text-midnight">Why we ask for a deposit first</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-midnight/70">
            Vehicle theft and fraudulent bookings are a real cost in Kenyan car hire, and that cost
            normally gets passed to honest customers through inflated rates and heavy security
            deposits. Verifying every renter lets us keep prices lower for everyone who has nothing
            to hide. It takes a few extra minutes. It&apos;s the reason we can quote what we quote.
          </p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          <TrustRow>
            <strong className="text-midnight">100% of drivers</strong> background-checked before
            their first trip
          </TrustRow>
          <TrustRow>
            <strong className="text-midnight">Every vehicle inspected</strong> before handover,
            every time
          </TrustRow>
        </ul>
      </section>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">
            Wherever you&apos;re headed, <span className="italic text-gold">twende.</span>
          </h2>
          <p className="max-w-md text-sm text-white/70">
            Tell us where you&apos;re going. We&apos;ll take it from there.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Twende. Book a Ride
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white p-5 text-center ring-1 ring-line">
      <div className="text-2xl font-bold text-gold-dark">{value}</div>
      <div className="mt-1 text-xs text-midnight/60">{label}</div>
    </div>
  );
}

function TrustRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 rounded-xl bg-white p-4 text-sm text-midnight/70 ring-1 ring-line">
      <span aria-hidden className="text-gold">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
