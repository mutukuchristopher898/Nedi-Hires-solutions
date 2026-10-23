import type { Metadata } from "next";
import Link from "next/link";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICES } from "@/lib/services";
import { quoteHref } from "@/lib/enquiryTopics";
import { site } from "@/lib/site";
import PageHero from "@/components/PageHero";
import { HERO_IMAGES } from "@/lib/heroImages";

const DESCRIPTION =
  "Self drive and chauffeur driven car hire, drivers for your own vehicle, airport transfers, corporate travel, corporate vehicle leasing, insurance replacement vehicles, family trips, tours and safaris, and event transport. One vetted fleet across Kenya.";

export const metadata: Metadata = {
  title: "Services",
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: { images: [site.ogImage], title: "Services", description: DESCRIPTION, url: "/services" },
};

// The outline groups services by who they are for, so a company or an
// insurer sees its options without reading past family trips.
const BUSINESS_SERVICES = new Set(["corporate-travel", "corporate-leasing", "insurance-replacement", "vehicle-partnership"]);

const GROUPS = [
  { title: "For you and your family", services: SERVICES.filter((s) => !BUSINESS_SERVICES.has(s.slug)) },
  { title: "For businesses, insurers and vehicle owners", services: SERVICES.filter((s) => BUSINESS_SERVICES.has(s.slug)) },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHero image={HERO_IMAGES.services} className="py-16">
        <div className="container-shell">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">Our services</h1>
          <p className="mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            Car hire, drivers and transport for individuals, companies and insurers across Kenya.
            Choose a service to see what&apos;s included, or ask us for a quote.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?topic=quote"
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Request a quote
            </Link>
            <Link
              href="/fleet"
              className="rounded-md border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Book a car
            </Link>
          </div>
        </div>
      </PageHero>

      {/* Outline: every service at a glance, each with a way in and a quote. */}
      <section aria-labelledby="outline-heading" className="container-shell py-14">
        <h2 id="outline-heading" className="text-2xl font-bold text-midnight">
          What we offer
        </h2>
        <div className="mt-8 space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-midnight/60">{group.title}</h3>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <li key={service.slug} className="flex flex-col rounded-xl bg-white p-5 ring-1 ring-line">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                        <ServiceIcon name={service.title} className="h-6 w-6 text-gold-dark" />
                      </div>
                      <h4 className="font-semibold text-midnight">{service.title}</h4>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-midnight/65">{service.summary}</p>
                    <div className="mt-auto flex items-center gap-4 pt-4 text-sm font-semibold">
                      <Link href={service.action?.href ?? quoteHref(service.slug)} className="text-gold-dark transition hover:text-gold">
                        {service.action?.label ?? "Get a quote"}
                      </Link>
                      <a href={`#${service.slug}`} className="text-midnight/60 transition hover:text-midnight">
                        Learn more
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Each service in full. */}
      <div className="border-t border-line bg-white">
        <div className="container-shell py-14">
          <div className="space-y-12">
            {SERVICES.map((service, index) => (
              <section
                key={service.slug}
                id={service.slug}
                // scroll-mt keeps the heading clear of the sticky header when
                // a "Learn more" link lands on it.
                className={`scroll-mt-24 ${index > 0 ? "border-t border-line pt-12" : ""}`}
              >
                <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                    <ServiceIcon name={service.title} className="h-8 w-8 text-gold-dark" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-midnight">{service.title}</h2>
                    <p className="mt-1 text-lg font-semibold text-gold-dark">{service.promise}</p>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-midnight/70">{service.intro}</p>

                    <h3 className="mt-6 text-sm font-semibold text-midnight">What&apos;s included</h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {service.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm text-midnight/70">
                          <span aria-hidden className="mt-0.5 text-gold">
                            ✓
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="mt-6 text-sm font-semibold text-midnight">Best for</h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-midnight/70">{service.bestFor}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <Link
                        href={service.action?.href ?? quoteHref(service.slug)}
                        className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
                      >
                        {service.action?.label ?? "Get a quote"}
                      </Link>
                      {service.cta.href === "/fleet" && (
                        <Link href="/fleet" className="text-sm font-semibold text-midnight/70 transition hover:text-midnight">
                          Or choose a car now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <section className="container-shell py-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Not sure which one you need?</h2>
          <p className="max-w-md text-sm text-white/70">
            Tell us where you&apos;re going, when, and how many of you there are. We&apos;ll recommend
            the right option and send you a price.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact?topic=quote"
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
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
