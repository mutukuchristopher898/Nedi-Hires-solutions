import RouteFeeEditor from "@/components/admin/RouteFeeEditor";
import { getRouteFees, getVehicleLocations } from "@/lib/supabase/queries";

export default async function AdminPricingPage() {
  const [{ routes, defaultFee }, locations] = await Promise.all([
    getRouteFees(),
    getVehicleLocations(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">One-way Fees</h1>
      <p className="mt-1 text-sm text-midnight/60">
        What a customer pays to return a vehicle somewhere other than where they collected it.
        Changes take effect immediately for new bookings; bookings already placed keep the fee
        they were quoted.
      </p>

      <div className="mt-6">
        <RouteFeeEditor routes={routes} defaultFee={defaultFee} locations={locations} />
      </div>
    </div>
  );
}
