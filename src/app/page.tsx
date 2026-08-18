import Link from "next/link";
import SearchWidget from "@/components/SearchWidget";
import VehicleCard from "@/components/VehicleCard";
import Testimonials from "@/components/Testimonials";
import ServiceIcon from "@/components/ServiceIcon";
import DemoTag from "@/components/DemoTag";
import { partnerNetwork, services, vehicles } from "@/lib/data";
import { site } from "@/lib/site";

const STEPS = [
  {
    step: "01",
    title: "Reservation & Deposit",
    copy: "Choose your dates and pay a reservation deposit online to hold your vehicle.",
  },
  {
    step: "02",
    title: "Identity Verification",
    copy: "Upload a passport, driver's license, or national ID for admin/partner review.",
  },
  {
    step: "03",
    title: "Final Settlement",
    copy: "Once verified, settle the remaining balance online or at vehicle handoff.",
  },
];

const featured = vehicles.filter((v) => v.approvalStatus === "approved").slice(0, 4);

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-midnight">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-charcoal to-charcoal-soft" />
        <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(200,153,46,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(18,165,117,0.25),transparent_40%)]" />

        <div className="container-shell relative py-20 lg:py-28">
          <p className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            {site.tagline}
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Reliable transport, memorable travel — anywhere in Kenya.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Self-drive or chauffeur-driven car hire, airport transfers, corporate travel,
            and tours & safaris — from a verified fleet of internal and partner vehicles.
          </p>
        </div>

        <div className="container-shell relative pb-16 lg:pb-20">
          <SearchWidget />
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-midnight">Our Services</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Affordable · Reliable · Comfortable — one platform for every kind of trip.
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.title} className="rounded-xl bg-white p-5 ring-1 ring-line">
              <ServiceIcon name={s.title} className="h-9 w-9 text-gold" />
              <h3 className="mt-3 font-semibold text-midnight">{s.title}</h3>
              <p className="mt-2 text-sm text-midnight/60">{s.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-charcoal py-14 text-white">
        <div className="container-shell">
          <h2 className="text-2xl font-bold">A security-first booking pipeline</h2>
          <p className="mt-1 max-w-xl text-sm text-white/60">
            A two-tiered payment and verification workflow protects both renters and
            vehicle owners at every step.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="text-sm font-semibold text-gold">{s.step}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-midnight">Featured vehicles</h2>
              <DemoTag />
            </div>
            <p className="mt-1 text-sm text-midnight/60">
              A mix of our internal fleet and verified partner inventory — illustrating full
              platform capability as our fleet grows.
            </p>
          </div>
          <Link href="/search" className="text-sm font-semibold text-gold-dark hover:text-gold">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </section>

      <section className="bg-offwhite py-14">
        <div className="container-shell">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-midnight">What our customers say</h2>
            <DemoTag />
          </div>
          <p className="mt-1 text-sm text-midnight/60">
            Sample reviews illustrating the kind of feedback we aim to earn from diaspora
            returnees, corporates, and tour groups.
          </p>
          <Testimonials />
        </div>
      </section>

      <section className="border-y border-line bg-white py-10">
        <div className="container-shell">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-midnight/40">
            Powered by a growing partner network across Kenya <DemoTag inline />
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-midnight/60">
            {partnerNetwork.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="grid gap-6 rounded-2xl bg-midnight p-8 text-white sm:grid-cols-2 sm:items-center lg:p-12">
          <div>
            <h2 className="text-2xl font-bold">Own a vehicle? Put it to work.</h2>
            <p className="mt-2 text-sm text-white/70">
              List your unit through our Managed Leasing Program or self-service partner
              dashboard. Every submission passes an admin approval queue before it goes live.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/partners"
              className="rounded-md border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Learn About Partnering
            </Link>
            <Link
              href="/partners/onboarding"
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
