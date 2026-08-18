import { site } from "@/lib/site";

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
    body: "When you book a partner-listed vehicle, relevant booking details are shared with that partner to coordinate handoff and support — never sold to unrelated third parties.",
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

export default function PrivacyPage() {
  return (
    <div className="container-shell max-w-2xl py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-gold-dark">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-midnight">Privacy Policy</h1>
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
