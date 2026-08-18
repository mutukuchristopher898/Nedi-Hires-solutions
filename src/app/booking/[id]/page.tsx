import { notFound } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";
import { getVehicleById } from "@/lib/data";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = getVehicleById(id);
  if (!vehicle) notFound();

  return (
    <div className="container-shell py-10">
      <h1 className="text-2xl font-bold text-midnight">Complete Your Booking</h1>
      <p className="mt-1 text-sm text-midnight/60">
        A security-first, two-tiered payment and verification workflow.
      </p>
      <div className="mt-8">
        <BookingWizard vehicle={vehicle} />
      </div>
    </div>
  );
}
