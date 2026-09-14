import Link from "next/link";
import PricingDefaultsEditor from "@/components/admin/PricingDefaultsEditor";
import { getPricingDefaults } from "@/lib/supabase/queries";

export default async function AdminPricingPage() {
  const defaults = await getPricingDefaults();

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Pricing &amp; Fees</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Changes take effect immediately for new bookings; a booking already placed keeps the
        figures it was quoted.
      </p>

      <div className="mt-6 space-y-8">
        <Link
          href="/admin/pricing/vehicles"
          className="block rounded-2xl bg-white p-5 ring-1 ring-line transition hover:ring-gold"
        >
          <p className="font-semibold text-midnight">Vehicle prices →</p>
          <p className="mt-1 text-sm text-midnight/60">
            Set the daily rate for each vehicle, and override the weekly or monthly discount where
            one car should be priced differently from the defaults below.
          </p>
        </Link>

        <PricingDefaultsEditor defaults={defaults} />

        {/* One way fees used to be a table of routes here. They were removed:
            repositioning a vehicle costs what it costs on the day, depending on
            the route and on when the car can be collected, and a flat per route
            figure only ever guessed at that. A different drop off is now an
            enquiry, priced by hand. */}
        <div className="rounded-2xl bg-offwhite p-5">
          <h2 className="text-lg font-semibold text-midnight">One-way hires</h2>
          <p className="mt-1 text-sm text-midnight/60">
            Not priced automatically. A customer wanting to return a vehicle somewhere else is
            pointed at the enquiry form, and you quote the route by hand.
          </p>
        </div>
      </div>
    </div>
  );
}
