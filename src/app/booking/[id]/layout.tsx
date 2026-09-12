import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getApprovedVehicleBySlug, getOneWayFeeTable } from "@/lib/supabase/queries";
import BookingShell from "@/components/booking/BookingShell";

export default async function BookingLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;

  // Previously read the static catalogue, which meant a partner-listed vehicle
  // could be found in search and then 404 the moment someone tried to book it.
  const [vehicle, feeTable] = await Promise.all([
    getApprovedVehicleBySlug(id),
    getOneWayFeeTable(),
  ]);

  if (!vehicle) notFound();

  return (
    <div className="container-shell py-10">
      <h1 className="text-2xl font-bold text-midnight">Complete Your Booking</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Just a few quick steps to secure your reservation.
      </p>
      <div className="mt-8">
        <BookingShell vehicle={vehicle} vehicleDbId={vehicle.id} feeTable={feeTable}>
          {children}
        </BookingShell>
      </div>
    </div>
  );
}
