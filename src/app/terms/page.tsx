import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing use of Nedi Hires Solutions and its vehicle hire services.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms & Conditions", description: "The terms governing use of Nedi Hires Solutions and its vehicle hire services.", url: "/terms" },
};

// These describe how the platform actually behaves today, which is the part
// that can be written honestly without a lawyer. What they are NOT is a
// complete or enforceable contract — see MISSING below, and the notice at the
// top of the page.
const SECTIONS = [
  {
    title: "1. Bookings & Reservations",
    body: "A reservation is confirmed once the reservation deposit is paid. The vehicle is held for the agreed pickup window; late arrivals beyond the grace period may result in the booking being released.",
  },
  {
    title: "2. Identity Verification",
    body: "All renters must submit a valid passport, driver's licence, or national ID for review before final settlement and vehicle handover. Bookings may be declined if documents cannot be verified.",
  },
  {
    title: "3. Payments & Deposits",
    body: `Reservation deposits, remaining rental balances, and refundable security deposits are processed through ${site.name}'s payment partners. Prices are quoted and charged in US dollars.`,
  },
  {
    title: "4. Whose Vehicle You Are Hiring",
    body: `${site.name} does not own the vehicles it hires out. Each is owned by the operator we source it from, and that operator holds the insurance on it. Every vehicle is checked, and its documentation reviewed, before it is offered to customers. What that insurance covers and what excess you would be liable for is not yet set out here — see below, and ask us before you book.`,
  },
  {
    title: "5. Cancellations",
    body: "Cancellation terms vary by vehicle and rental length. Contact us with your booking reference as early as possible to discuss changes or refunds.",
  },
  {
    title: "6. Liability",
    body: "Renters are responsible for traffic violations, tolls, and damage incurred during the rental period beyond normal wear, subject to the security deposit and any applicable insurance cover.",
  },
];

// Named rather than silently absent. A customer reading a short terms page has
// no way to tell the difference between "this does not apply to us" and "we
// never wrote it down", and the second is what is true here. Listing the gaps
// is also the brief for whoever completes them.
const MISSING = [
  "Who you are contracting with — registered company name, registration number, KRA PIN and registered address",
  "Insurance: what cover the partner's policy provides, the excess a renter is liable for, and what voids it",
  "Concrete cancellation and refund terms — notice periods and what percentage is returned at each",
  "Driver requirements: minimum age, minimum licence held period, and whether foreign or international licences are accepted",
  "Mileage limits, permitted geographic area, and whether cross-border travel is allowed",
  "Fuel policy, late return charges, cleaning charges, and any other fee a renter could actually incur",
  "What happens in an accident, breakdown or theft — who to call, who pays, and when",
  "Governing law, and how a dispute gets resolved",
  "Data protection: your rights under the Kenyan Data Protection Act 2019 and the contact for exercising them",
];

export default function TermsPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-midnight">Terms of Service</h1>

      <div className="mt-4 rounded-lg bg-amber/10 p-4 text-sm text-amber">
        <p className="font-semibold">These terms are incomplete and are not yet a contract.</p>
        <p className="mt-1.5">
          What follows describes how the platform works today. It has not been drafted or
          reviewed by a lawyer, and it leaves out things that would decide a real dispute —
          insurance excess, cancellation terms, and who is liable after an accident among them.
        </p>
        <p className="mt-1.5">
          Until this is completed, the terms of any hire are whatever we agree with you directly
          in writing. If something here matters to your booking, ask us before you book and
          we&apos;ll confirm it.
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
          Listed openly rather than left blank, so you can see what this page does not yet cover
          and ask us directly in the meantime.
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
        <p className="mt-4 text-sm text-midnight/60">
          Questions about any of it: <span className="font-medium text-midnight">{site.email}</span>{" "}
          or {site.phoneDisplay}.
        </p>
      </section>
    </div>
  );
}
