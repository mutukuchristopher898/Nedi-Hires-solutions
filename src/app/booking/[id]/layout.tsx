import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getVehicleById } from "@/lib/data";
import { getVehicleDbIdBySlug } from "@/lib/supabase/queries";
import BookingShell from "@/components/booking/BookingShell";

export default async function BookingLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;
  const vehicle = getVehicleById(id);
  if (!vehicle) notFound();

  const vehicleDbId = await getVehicleDbIdBySlug(id);

  return (
    <div className="container-shell py-10">
      <h1 className="text-2xl font-bold text-midnight">Complete Your Booking</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Just a few quick steps to secure your reservation.
      </p>
      <div className="mt-8">
        <BookingShell vehicle={vehicle} vehicleDbId={vehicleDbId}>
          {children}
        </BookingShell>
      </div>
    </div>
  );
}
