import Image from "next/image";
import VehicleApprovalActions from "@/components/admin/VehicleApprovalActions";
import { getVehiclesAwaitingApproval } from "@/lib/supabase/queries";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import { formatMoney } from "@/lib/data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminApprovalsPage() {
  const vehicles = await getVehiclesAwaitingApproval();

  return (
    <div>
      <h1 className="text-2xl font-bold text-midnight">Unit Approval Queue</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Vehicles partners have submitted. Approving one publishes it to search immediately;
        rejecting leaves it visible only to the partner. Oldest first.
      </p>

      {vehicles.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">Nothing waiting for review.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {vehicles.length} awaiting review
          </p>

          <div className="mt-4 space-y-4">
            {vehicles.map((v) => (
              <article key={v.id} className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
                {v.photoPaths.length > 0 ? (
                  <Image
                    src={publicVehiclePhotoUrl(v.photoPaths[0])}
                    alt={`${v.make} ${v.model}`}
                    width={160}
                    height={120}
                    className="h-28 w-40 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-lg bg-amber/10 text-xs text-amber">
                    No photo
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-midnight">
                    {v.make} {v.model} {v.year}
                  </h2>
                  <p className="mt-0.5 text-sm text-midnight/70">
                    {v.partnerName ?? "Unknown partner"} · submitted {formatDate(v.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-midnight/60">
                    {v.licensePlate} · {v.classification} · {v.transmission} · {v.fuelType} ·{" "}
                    {v.capacity} seats · {v.location}
                  </p>
                  <p className="mt-1 text-sm font-medium text-midnight">
                    {formatMoney(v.pricePerDay, v.currency)} / day
                  </p>
                  {v.description && (
                    <p className="mt-2 text-sm text-midnight/70">{v.description}</p>
                  )}
                  {v.features.length > 0 && (
                    <p className="mt-2 text-xs text-midnight/50">{v.features.join(" · ")}</p>
                  )}
                  {v.photoPaths.length > 1 && (
                    <p className="mt-2 text-xs text-midnight/50">
                      +{v.photoPaths.length - 1} more photo{v.photoPaths.length - 1 === 1 ? "" : "s"}
                    </p>
                  )}
                </div>

                <VehicleApprovalActions
                  id={v.id}
                  label={`${v.make} ${v.model} ${v.year}`}
                  hasPhoto={v.photoPaths.length > 0}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
