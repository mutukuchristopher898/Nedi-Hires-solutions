import Link from "next/link";
import VehiclePricingEditor from "@/components/admin/VehiclePricingEditor";
import { getPricingDefaults, getVehiclePricing } from "@/lib/supabase/queries";

export default async function AdminVehiclePricingPage() {
  const [vehicles, defaults] = await Promise.all([getVehiclePricing(), getPricingDefaults()]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-midnight">Per-vehicle Pricing</h1>
        <Link href="/admin/pricing" className="text-sm font-semibold text-gold-dark hover:text-gold">
          Platform defaults &amp; one-way fees →
        </Link>
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        Long-hire discounts and deposit rates per vehicle. Partners set the daily price; these are
        yours. Changes apply to new bookings — one already placed keeps the figures it was quoted.
      </p>

      <div className="mt-6">
        <VehiclePricingEditor vehicles={vehicles} defaults={defaults} />
      </div>
    </div>
  );
}
