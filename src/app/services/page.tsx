import type { Metadata } from "next";
import Link from "next/link";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICES } from "@/lib/services";
import { site } from "@/lib/site";

const DESCRIPTION =
  "Self-drive and chauffeur-driven car hire, airport transfers, corporate travel, family trips, tours and safaris, and event transport — one vetted fleet across Kenya.";

export const metadata: Metadata = {
  title: "Services",
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
  openGraph: { title: "Services", description: DESCRIPTION, url: "/services" },
};

export default function ServicesPage() {
  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">What we do</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">
            Every kind of trip, one platform
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            <strong className="font-semibold text-white">
              Affordable · Reliable · Comfortable.
            </strong>{" "}
            Whether it&apos;s a 20-minute airport run or two weeks across the Mara, you&apos;re
            booking from the same vetted fleet — with the same standards behind it.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Twende — Book a Ride
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

      {/* A jump list, because seven long sections is a lot of scrolling to find
          the one you came for. */}
      <nav aria-label="Services" className="border-b border-line bg-offwhite">
        <div className="container-shell flex flex-wrap gap-x-4 gap-y-2 py-4">
          {SERVICES.map((s) => (
            <a
              key={s.slug}
              href={`#${s.slug}`}
              className="text-sm font-medium text-midnight/70 transition hover:text-gold-dark"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="container-shell py-14">
        <div className="space-y-12">
          {SERVICES.map((service, index) => (
            <section
              key={service.slug}
              id={service.slug}
              // scroll-mt keeps the heading clear of the sticky header when the
              // jump links land on it.
              className={`scroll-mt-24 ${index > 0 ? "border-t border-line pt-12" : ""}`}
            >
              <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/10">
                  <ServiceIcon name={service.title} className="h-8 w-8 text-gold-dark" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-midnight">{service.title}</h2>
                  <p className="mt-1 text-lg font-semibold text-gold-dark">{service.promise}</p>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-midnight/70">
                    {service.intro}
                  </p>

                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {service.points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm text-midnight/70">
                        <span aria-hidden className="mt-1 text-gold">
                          ✓
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-5 text-sm italic text-midnight/50">
                    Best for: {service.bestFor}
                  </p>

                  <Link
                    href={service.cta.href}
                    className="mt-5 inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
                  >
                    {service.cta.label}
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="container-shell pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-midnight p-10 text-center text-white">
          <h2 className="text-2xl font-bold">Not sure which one you need?</h2>
          <p className="max-w-md text-sm text-white/70">
            Tell us where you&apos;re going and how many of you there are. We&apos;ll tell you what
            it costs.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              Twende — Book a Ride
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
