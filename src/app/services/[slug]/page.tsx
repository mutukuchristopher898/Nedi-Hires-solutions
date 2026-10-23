import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import ServiceIcon from "@/components/ServiceIcon";
import { SERVICES } from "@/lib/services";
import { quoteHref } from "@/lib/enquiryTopics";
import { SERVICE_IMAGES } from "@/lib/heroImages";
import { site } from "@/lib/site";

// One page per service, built from src/lib/services.ts. Reached from the
// Services menu in the top bar and the cards on /services.

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  const title = `${service.title} in Kenya`;
  return {
    title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { images: [site.ogImage], title, description: service.summary, url: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const primary = service.action ?? { label: "Get a quote", href: quoteHref(service.slug) };
  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <div>
      <PageHero image={SERVICE_IMAGES[service.slug] ?? null} className="py-20">
        <div className="container-shell">
          <Link href="/services" className="text-sm text-white/60 transition hover:text-white">
            ← All services
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/60">
              <ServiceIcon name={service.title} className="h-6 w-6 text-gold" />
            </span>
            <h1 className="text-3xl font-bold sm:text-5xl">{service.title}</h1>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-white/85 sm:text-xl">{service.promise}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primary.href}
              className="rounded-md bg-gold px-7 py-3.5 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
            >
              {primary.label}
            </Link>
            {service.cta.href === "/fleet" && (
              <Link
                href="/fleet"
                className="rounded-md border border-white/20 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Choose a car
              </Link>
            )}
          </div>
        </div>
      </PageHero>

      <section className="container-shell grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold text-midnight">About this service</h2>
          <p className="mt-4 text-base leading-relaxed text-midnight/75">{service.intro}</p>

          <h2 className="mt-10 text-xl font-bold text-midnight">What&apos;s included</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {service.points.map((point) => (
              <li key={point} className="flex gap-3 rounded-lg bg-white p-4 text-sm text-midnight/75 ring-1 ring-line">
                <span aria-hidden className="text-gold">
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-2xl bg-midnight p-8 text-white">
          <h2 className="text-lg font-semibold text-gold">Best for</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">{service.bestFor}</p>
          <Link
            href={primary.href}
            className="mt-6 block rounded-md bg-gold px-5 py-3 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            {primary.label}
          </Link>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-md border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ask on WhatsApp
          </a>
        </aside>
      </section>

      <section className="border-t border-line bg-white">
        <div className="container-shell py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-midnight">Other services</h2>
            <Link href="/services" className="text-sm font-semibold text-gold-dark hover:text-gold">
              All services
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="flex h-full flex-col rounded-xl p-5 ring-1 ring-line transition hover:ring-gold"
                >
                  <ServiceIcon name={s.title} className="h-6 w-6 text-gold-dark" />
                  <span className="mt-3 font-semibold text-midnight">{s.title}</span>
                  <span className="mt-1 text-sm text-midnight/60">{s.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
