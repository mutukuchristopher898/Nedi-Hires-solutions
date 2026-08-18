import ContactForm from "@/components/ContactForm";
import { site } from "@/lib/site";

export default function ContactPage() {
  return (
    <div>
      <section className="bg-midnight py-14 text-white">
        <div className="container-shell">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">Contact Support</p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">We&apos;re here to help.</h1>
          <p className="mt-3 max-w-lg text-sm text-white/70">
            Reach us for booking help, custom tour quotes, corporate accounts, or partner
            enquiries.
          </p>
        </div>
      </section>

      <section className="container-shell grid gap-8 py-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <ContactCard
            title="Call / WhatsApp"
            value={site.phoneDisplay}
            href={site.whatsappHref}
            note="Fastest response — usually within minutes during business hours."
          />
          <ContactCard title="Email" value={site.email} href={`mailto:${site.email}`} note="For quotes, invoices, and partner enquiries." />
          <ContactCard title="Location" value={site.location} note="Vehicle handoff and pickup points across Nairobi and partner cities." />
        </div>

        <ContactForm />
      </section>
    </div>
  );
}

function ContactCard({
  title,
  value,
  href,
  note,
}: {
  title: string;
  value: string;
  href?: string;
  note: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-line">
      <div className="text-xs font-medium uppercase tracking-wide text-midnight/50">{title}</div>
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-1 block text-lg font-semibold text-midnight hover:text-gold-dark">
          {value}
        </a>
      ) : (
        <div className="mt-1 text-lg font-semibold text-midnight">{value}</div>
      )}
      <p className="mt-1 text-sm text-midnight/60">{note}</p>
    </div>
  );
}
