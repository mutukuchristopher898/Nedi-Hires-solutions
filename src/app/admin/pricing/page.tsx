import Link from "next/link";
import PricingDefaultsEditor from "@/components/admin/PricingDefaultsEditor";
import RouteFeeEditor from "@/components/admin/RouteFeeEditor";
import { getPricingDefaults, getRouteFees, getVehicleLocations } from "@/lib/supabase/queries";

export default async function AdminPricingPage() {
  const [{ routes, defaultFee }, locations, defaults] = await Promise.all([
    getRouteFees(),
    getVehicleLocations(),
    getPricingDefaults(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-midnight">Pricing &amp; Fees</h1>
        <Link href="/admin/pricing/vehicles" className="text-sm font-semibold text-gold-dark hover:text-gold">
          Per-vehicle pricing →
        </Link>
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        Changes take effect immediately for new bookings; a booking already placed keeps the
        figures it was quoted.
      </p>

      <div className="mt-6 space-y-8">
        <PricingDefaultsEditor defaults={defaults} />

        <div>
          <h2 className="text-lg font-semibold text-midnight">One-way fees</h2>
          <p className="mt-1 text-sm text-midnight/60">
            What a customer pays to return a vehicle somewhere other than where they collected it.
          </p>
          <div className="mt-4">
            <RouteFeeEditor routes={routes} defaultFee={defaultFee} locations={locations} />
          </div>
        </div>
      </div>
    </div>
  );
}
