import Link from "next/link";
import { notFound } from "next/navigation";
import VehicleForm from "@/components/admin/VehicleForm";
import AuditChanges from "@/components/admin/AuditChanges";
import { requireRole } from "@/lib/supabase/authz";
import { getAdminVehicleById, getPartnerOptions, getAuditLog } from "@/lib/supabase/queries";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["staff", "admin"], "/admin/vehicles");
  const { id } = await params;

  const [vehicle, partners] = await Promise.all([getAdminVehicleById(id), getPartnerOptions()]);
  if (!vehicle) notFound();

  // Recent activity for this record, which is the question an operator
  // actually has when something looks wrong: who last touched it.
  const { entries } = await getAuditLog({ entityType: "vehicles", entityId: id, limit: 10 });

  return (
    <div>
      <Link href="/admin/vehicles" className="text-sm text-midnight/60 hover:text-gold">
        ← Back to vehicles
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-midnight">
        {vehicle.make} {vehicle.model} {vehicle.year}
      </h1>
      <p className="mt-1 text-sm text-midnight/60">
        {vehicle.licensePlate} · {vehicle.partnerName ?? "No partner"} · {vehicle.lifecycle}
      </p>

      {vehicle.archivedAt && (
        <p className="mt-4 rounded-md bg-midnight/5 px-4 py-3 text-sm text-midnight/60">
          Archived on {formatWhen(vehicle.archivedAt)}. It is out of the fleet and not bookable;
          past bookings that reference it are unaffected.
        </p>
      )}
      {vehicle.rejectionReason && (
        <p className="mt-4 rounded-md bg-red-500/5 px-4 py-3 text-sm text-red-600">
          Rejected: {vehicle.rejectionReason}
        </p>
      )}

      <VehicleForm vehicle={vehicle} partners={partners} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Recent activity</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">No staff changes recorded for this vehicle.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-xs text-midnight/60">
                  {entry.actorEmail ?? "Unknown"} · {entry.action} · {formatWhen(entry.createdAt)}
                </p>
                <div className="mt-2">
                  <AuditChanges changes={entry.changes} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
