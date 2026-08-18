import { site } from "@/lib/site";

const SECTIONS = [
  {
    title: "1. Bookings & Reservations",
    body: "A reservation is confirmed once the reservation deposit is paid. The vehicle is held for the agreed pickup window; late arrivals beyond the grace period may result in the booking being released.",
  },
  {
    title: "2. Identity Verification",
    body: "All renters must submit a valid International Passport, Driver's License, or National ID for review before final settlement and vehicle handoff. Bookings may be declined if documents cannot be verified.",
  },
  {
    title: "3. Payments & Deposits",
    body: `Reservation deposits, remaining rental balances, and refundable security deposits are processed through ${site.name}'s payment partners in KES, USD, EUR, or GBP depending on your location.`,
  },
  {
    title: "4. Partner & Managed Vehicles",
    body: "Vehicles listed by partner fleets or private hosts are reviewed through an admin approval queue before appearing on the platform, but are owned and insured by the respective partner unless stated otherwise.",
  },
  {
    title: "5. Cancellations",
    body: "Cancellation terms vary by vehicle and rental length. Contact Support with your booking reference as early as possible to discuss changes or refunds.",
  },
  {
    title: "6. Liability",
    body: "Renters are responsible for traffic violations, tolls, and damage incurred during the rental period beyond normal wear, subject to the security deposit and any applicable insurance cover.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-midnight">Terms of Service</h1>
      <p className="mt-3 rounded-lg bg-amber/10 p-3 text-sm text-amber">
        Placeholder draft for prototype purposes only — review with legal counsel before
        publishing a live version.
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-semibold text-midnight">{s.title}</h2>
            <p className="mt-1 text-sm text-midnight/70">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
