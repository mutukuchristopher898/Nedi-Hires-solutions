import Image from "next/image";
import Link from "next/link";
import Testimonials from "@/components/Testimonials";
import DemoTag from "@/components/DemoTag";
import { site } from "@/lib/site";

const STATS = [
  { label: "Vehicles in Network", value: "50+" },
  { label: "Trips Completed", value: "1,200+" },
  { label: "Partner Fleets", value: "6" },
  { label: "Average Rating", value: "4.8/5" },
];

const VALUES = [
  {
    title: "Affordable",
    copy: "Transparent daily rates in KES with no hidden charges — pay a fair price for a well-kept vehicle.",
  },
  {
    title: "Reliable",
    copy: "Every vehicle and partner passes an admin approval queue before it's visible to customers.",
  },
  {
    title: "Comfortable",
    copy: "Clean, serviced vehicles and — for chauffeur-driven hires — professional, vetted drivers.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell grid gap-8 lg:grid-cols-[1.3fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gold">About Us</p>
            <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">
              Kenya&apos;s trusted partner for transport, travel, and tours.
            </h1>
            <p className="mt-3 max-w-lg text-sm text-white/70">
              {site.name} connects travelers, businesses, and everyday drivers with a verified
              network of self-drive and chauffeur-driven vehicles — from airport transfers in
              Nairobi to safari transfers across the country.
            </p>
          </div>
          <div className="hidden justify-self-center rounded-2xl bg-white p-4 shadow-xl sm:block">
            <Image src="/logo.png" alt={site.name} width={220} height={220} className="h-44 w-44 object-contain" />
          </div>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-bold text-midnight">Our story</h2>
            <p className="mt-3 text-sm leading-relaxed text-midnight/70">
              {site.name} started with a simple idea: renting a car or booking a tour vehicle
              in Kenya should feel as easy and trustworthy as any world-class travel platform.
              We began with a small internal fleet serving airport pickups, and have since
              grown into a network of vetted partner fleets, tour operators, and private hosts
              — all held to the same quality and verification standard.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-midnight/70">
              Every partner vehicle passes through an admin approval queue before it ever
              reaches a customer, and every booking runs through a two-tiered payment and
              identity verification workflow — so you can book with confidence, whether
              you&apos;re landing at JKIA for the first time or heading out on a weekend safari.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 -mb-2 flex justify-end">
              <DemoTag />
            </div>
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl bg-white p-5 text-center ring-1 ring-line">
                <div className="text-2xl font-bold text-gold-dark">{s.value}</div>
                <div className="mt-1 text-xs text-midnight/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-charcoal py-14 text-white">
        <div className="container-shell">
          <h2 className="text-2xl font-bold">Why travelers choose us</h2>
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
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-midnight">What our customers say</h2>
          <DemoTag />
        </div>
        <Testimonials />
      </section>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to book your next trip?</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/search" className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white">
              Browse Vehicles
            </Link>
            <Link href="/contact" className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
