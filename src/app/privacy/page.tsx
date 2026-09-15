import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Nedi Hires Solutions collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy", description: "How Nedi Hires Solutions collects, uses and protects your personal data.", url: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "Contact details, identity documents submitted for verification, booking history, and payment confirmations needed to process your rental.",
  },
  {
    title: "2. How We Use Your Information",
    body: `${site.name} uses your information to verify bookings, communicate updates, process payments, and improve our fleet and partner network.`,
  },
  {
    title: "3. Identity Documents",
    body: "Passport, driver's license, and national ID images submitted during booking are used only for verification and are shared only with the admin team or the specific partner fulfilling your booking.",
  },
  {
    title: "4. Sharing With Partners",
    body: "When you book a partner listed vehicle, relevant booking details are shared with that partner to coordinate handoff and support, never sold to unrelated third parties.",
  },
  {
    title: "5. Data Retention",
    body: "Booking and verification records are retained for as long as needed for support, disputes, and legal compliance, then securely deleted.",
  },
  {
    title: "6. Contact Us",
    body: `Questions about this policy can be sent to ${site.email}.`,
  },
];

// The Data Protection Act 2019 obligations are the ones with teeth here: this
// site collects passports, national IDs and driving licences, which the Act
// treats as sensitive personal data. Naming what is missing is more use to a
// reader than a policy that quietly omits their rights.
const MISSING = [
  "The registered data controller — company name, registration number and registered address",
  "Registration with the Office of the Data Protection Commissioner, which the Act requires of controllers processing sensitive personal data",
  "A named Data Protection Officer or contact, and how to reach them",
  "Your rights under the Data Protection Act 2019: access, correction, deletion, objection, and portability, with how to exercise each and how long we take to respond",
  "The lawful basis relied on for each kind of processing",
  "Concrete retention periods, rather than 'as long as necessary'",
  "Every third party your data reaches, named — hosting, identity verification and payment providers included",
  "Whether data leaves Kenya, and on what safeguards",
  "How to complain to the Office of the Data Protection Commissioner",
];

export default function PrivacyPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-midnight">Privacy Policy</h1>
      <div className="mt-4 rounded-lg bg-amber/10 p-4 text-sm text-amber">
        <p className="font-semibold">This policy is incomplete.</p>
        <p className="mt-1.5">
          It describes what we do with your data today, honestly, but it has not been drafted or
          reviewed by a lawyer and it does not yet set out your rights under the Kenyan Data
          Protection Act 2019 in the form the Act requires.
        </p>
        <p className="mt-1.5">
          That does not reduce those rights. You can ask us what we hold about you, ask us to
          correct or delete it, or object to how we use it, and we will act on it — write to{" "}
          <span className="font-medium">{site.email}</span>.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-semibold text-midnight">{s.title}</h2>
            <p className="mt-1 text-sm text-midnight/70">{s.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-offwhite p-5">
        <h2 className="font-semibold text-midnight">Still to be written</h2>
        <p className="mt-1 text-sm text-midnight/60">
          Listed openly rather than left blank. If any of it affects whether you are willing to
          hand us a document, ask us first.
        </p>
        <ul className="mt-3 space-y-1.5">
          {MISSING.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-midnight/70">
              <span aria-hidden className="text-midnight/30">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
