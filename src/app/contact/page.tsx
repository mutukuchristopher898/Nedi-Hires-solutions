import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import SocialLinks from "@/components/SocialLinks";
import { site } from "@/lib/site";
import { findTopic } from "@/lib/enquiryTopics";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Talk to the Nedi Hires Solutions team about a booking, a quote, or group and event transport across Kenya.",
  alternates: { canonical: "/contact" },
  openGraph: { images: [site.ogImage], title: "Contact us", description: "Talk to the Nedi Hires Solutions team about a booking, a quote, or group and event transport across Kenya.", url: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  // Services link here with ?topic=…, so the right topic is already chosen.
  const { topic } = await searchParams;
  const initialTopic = findTopic(typeof topic === "string" ? topic : undefined)?.value;

  return (
    <div>
      <section className="bg-midnight py-14 text-white">
        <div className="container-shell">
          <h1 className="max-w-xl text-3xl font-bold sm:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-lg text-sm text-white/70 sm:text-base">
            Help with a booking, a quote for your company or insurance clients, or a driver for your
            own vehicle. Choose the quickest way to reach us.
          </p>
        </div>
      </section>

      <section className="container-shell grid gap-8 py-14 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-midnight">Phone and WhatsApp</h2>
            <p className="mt-1 text-lg font-semibold text-midnight">{site.phoneDisplay}</p>
            <p className="mt-1 text-sm text-midnight/60">
              The fastest way to reach us, usually answered within minutes during business hours.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${site.phoneTel}`}
                className="rounded-md bg-midnight px-4 py-2 text-sm font-semibold text-white transition hover:bg-midnight/85"
              >
                Call us
              </a>
              <a
                href={site.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-midnight transition hover:border-gold hover:text-gold-dark"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-midnight">Email</h2>
            <a href={`mailto:${site.email}`} className="mt-1 block break-all text-base font-semibold text-midnight hover:text-gold-dark">
              {site.email}
            </a>
            <p className="mt-1 text-sm text-midnight/60">For quotes, invoices and account questions.</p>
          </div>

          <div className="rounded-xl bg-white p-5 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-midnight">Where we operate</h2>
            <p className="mt-1 text-base font-semibold text-midnight">{site.location}</p>
            <p className="mt-1 text-sm text-midnight/60">Vehicle handover and pickup across Nairobi and beyond.</p>
          </div>

          <div className="rounded-xl bg-white p-5 ring-1 ring-line">
            <h2 className="text-sm font-semibold text-midnight">Follow us</h2>
            <p className="mb-3 mt-1 text-sm text-midnight/60">News, offers and new vehicles.</p>
            <SocialLinks />
          </div>
        </div>

        <ContactForm initialTopic={initialTopic} />
      </section>
    </div>
  );
}
