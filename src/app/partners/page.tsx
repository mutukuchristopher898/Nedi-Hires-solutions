import Link from "next/link";
import { partnerNetwork } from "@/lib/data";
import DemoTag from "@/components/DemoTag";

const STEPS = [
  {
    title: "Account Creation",
    copy: "Secure business registration with verification of tax credentials, business licenses, or personal identity documentation.",
  },
  {
    title: "Unit Specification Input",
    copy: "Submit Make, Model, Year, License Plate, Classification, Fuel Type, Transmission, and Capacity for every vehicle.",
  },
  {
    title: "Admin Approval Queue",
    copy: "Your unit enters a Pending state and only appears on the customer frontend after passing quality checks.",
  },
];

const CHANNELS = [
  {
    title: "Managed Leasing Program",
    copy: "Hand your vehicle to us for full asset management under a revenue split — we handle bookings, maintenance coordination, and customer support.",
  },
  {
    title: "B2B Marketplace Aggregation",
    copy: "List your existing tour or car hire inventory and pay a commission only on bookings we bring you.",
  },
];

export default function PartnersPage() {
  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald">For Partners</p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">
            Decentralized inventory scaling, under centralized quality control.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/70">
            Individual vehicle owners, commercial fleet operators, and tourism transit
            providers can all list inventory through a self-service partner dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/partners/onboarding"
              className="rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
            >
              Start Onboarding
            </Link>
            <Link
              href="/partners/dashboard"
              className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Partner Dashboard
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/60">
            Partners get their own subscription tier —{" "}
            <Link href="/subscriptions" className="underline hover:text-white">
              see partner pricing
            </Link>
            , or{" "}
            <Link href="/partners/quote" className="underline hover:text-white">
              request a custom quote
            </Link>{" "}
            if you&apos;re listing a larger fleet.
          </p>
        </div>
      </section>

      <section className="container-shell py-14">
        <h2 className="text-2xl font-bold text-midnight">Two ways to earn</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <div key={c.title} className="rounded-xl bg-white p-6 ring-1 ring-line">
              <h3 className="font-semibold text-midnight">{c.title}</h3>
              <p className="mt-2 text-sm text-midnight/60">{c.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-charcoal py-14 text-white">
        <div className="container-shell">
          <h2 className="text-2xl font-bold">Onboarding workflow</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="text-sm font-semibold text-emerald">{`0${i + 1}`}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-midnight">Our Current Partner Network</h2>
          <DemoTag />
        </div>
        <p className="mt-1 text-sm text-midnight/60">
          Fleet operators and tour agencies already listing verified vehicles with us.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerNetwork.map((name) => (
            <div key={name} className="flex items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold-dark">
                {name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="text-sm font-medium text-midnight">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
