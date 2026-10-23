import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { HERO_IMAGES } from "@/lib/heroImages";
import { site } from "@/lib/site";

// Vehicle partnership: an owner hands a vehicle to Nedi Hires, which manages
// and rents it out, and the owner earns an agreed percentage. The percentage
// and terms are agreed per owner, so none are published here. Keep every
// statement on this page true to how partnerships actually run.

const DESCRIPTION =
  "Partner with Nedi Hires: hand us your vehicle, we manage and rent it out, and you earn an agreed percentage of what it makes.";

export const metadata: Metadata = {
  title: "Partner with us",
  description: DESCRIPTION,
  alternates: { canonical: "/partner" },
  openGraph: { images: [site.ogImage], title: "Partner with us", description: DESCRIPTION, url: "/partner" },
};

const ENQUIRY_HREF = "/contact?topic=partnership";

const STEPS = [
  { title: "Tell us about your vehicle", copy: "Send us its make, model, year and condition, and where it\u2019s kept." },
  { title: "Inspection and agreement", copy: "We inspect the vehicle, then agree your percentage and the terms with you before anything starts." },
  { title: "We put it to work", copy: "Your vehicle joins our fleet. We handle the bookings, the customers, the handovers and the upkeep." },
  { title: "You earn", copy: "You receive your agreed share of what your vehicle earns." },
];

const WE_HANDLE = [
  "Advertising and bookings",
  "Customer ID and licence checks before every hire",
  "Vehicle handovers and returns",
  "Coordinating servicing and repairs",
];

const YOU_GET = [
  "An agreed percentage of your vehicle\u2019s earnings",
  "A partner account to follow your vehicle",
  "A team to call whenever you have a question",
  "Your vehicle earning instead of sitting idle",
];

const WE_LOOK_FOR = [
  "A roadworthy vehicle in good condition",
  "A logbook in your name or your company\u2019s",
  "Valid insurance",
  "A pass on our inspection",
];

function Tick() {
  return (
    <span aria-hidden className="mt-0.5 text-gold">
      ✓
    </span>
  );
}

export default function PartnerPage() {
  return (
    <div>
      <PageHero image={HERO_IMAGES.partner} className="py-20">
        <div className="container-shell">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-5xl">Partner with us</h1>
          <p className="mt-4 max-w-xl text-sm text-white/75 sm:text-lg">
            Own a vehicle that spends too much time parked? Hand it over to Nedi Hires. We manage
            it, and you earn an agreed percentage of every hire.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ENQUIRY_HREF}
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Partner with us
            </Link>
            <a
              href="#how-it-works"
              className="rounded-md border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              How it works
            </a>
          </div>
        </div>
      </PageHero>

      <section id="how-it-works" aria-labelledby="how-heading" className="container-shell scroll-mt-24 py-16">
        <h2 id="how-heading" className="text-2xl font-bold text-midnight sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl bg-white p-6 ring-1 ring-line">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 text-sm font-semibold text-gold-dark">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-midnight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-midnight/65">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-shell grid gap-10 py-16 md:grid-cols-3">
          {[
            { title: "What we take care of", items: WE_HANDLE },
            { title: "What you get", items: YOU_GET },
            { title: "What we look for", items: WE_LOOK_FOR },
          ].map((col) => (
            <div key={col.title}>
              <h2 className="text-lg font-semibold text-midnight">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-midnight/70">
                    <Tick />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-midnight">Your share</h2>
          <p className="mt-3 text-sm leading-relaxed text-midnight/70">
            Your percentage is agreed with you individually. It depends on the vehicle and how
            it&apos;s used, and we&apos;ll explain it clearly, with the terms, before you commit to
            anything.
          </p>
          <p className="mt-6 text-sm text-midnight/60">
            Prefer to list and run your vehicle yourself?{" "}
            <Link href="/list-your-vehicle/start" className="font-semibold text-gold-dark hover:text-gold">
              List it on our platform
            </Link>
            . Already a partner?{" "}
            <Link href="/my-vehicles" className="font-semibold text-gold-dark hover:text-gold">
              Go to your vehicles
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to put your vehicle to work?</h2>
          <p className="max-w-md text-sm text-white/70">
            Tell us about your vehicle and we&apos;ll get back to you to arrange an inspection.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={ENQUIRY_HREF}
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Partner with us
            </Link>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
