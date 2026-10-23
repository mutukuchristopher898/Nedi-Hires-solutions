import type { Metadata } from "next";
import Link from "next/link";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICE_GROUPS } from "@/lib/services";
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
          {SERVICE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-midnight/60">{group.title}</h3>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                  <li key={service.slug} className="flex flex-col rounded-xl bg-white p-5 ring-1 ring-line">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                        <ServiceIcon name={service.title} className="h-6 w-6 text-gold-dark" />
                      </div>
                      <h4 className="font-semibold text-midnight">
                        <Link href={`/services/${service.slug}`} className="transition hover:text-gold-dark">
                          {service.title}
                        </Link>
                      </h4>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-midnight/65">{service.summary}</p>
                    <div className="mt-auto flex items-center gap-4 pt-4 text-sm font-semibold">
                      <Link href={service.action?.href ?? quoteHref(service.slug)} className="text-gold-dark transition hover:text-gold">
                        {service.action?.label ?? "Get a quote"}
                      </Link>
                      <Link href={`/services/${service.slug}`} className="text-midnight/60 transition hover:text-midnight">
                        View service
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

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
