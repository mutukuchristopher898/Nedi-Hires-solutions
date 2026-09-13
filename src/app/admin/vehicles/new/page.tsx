import Link from "next/link";
import VehicleForm from "@/components/admin/VehicleForm";
import { requireRole } from "@/lib/supabase/authz";
import { getPartnerOptions, getOptions } from "@/lib/supabase/queries";

export default async function NewVehiclePage() {
  await requireRole(["staff", "admin"], "/admin/vehicles/new");
  const [partners, featureOptions, locationOptions] = await Promise.all([
    getPartnerOptions(),
    getOptions("vehicle_feature"),
    getOptions("pickup_location"),
  ]);

  return (
    <div>
      <Link href="/admin/vehicles" className="text-sm text-midnight/60 hover:text-gold">
        ← Back to vehicles
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-midnight">Add a vehicle</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Created as pending, so it still goes through approval before customers see it. Attribute
        it to a partner if you are listing on their behalf.
      </p>
      <VehicleForm partners={partners} featureOptions={featureOptions} locationOptions={locationOptions} />
    </div>
  );
}
