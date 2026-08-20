import { notFound } from "next/navigation";
import Link from "next/link";
import VehiclePhoto from "@/components/VehiclePhoto";
import DemoTag from "@/components/DemoTag";
import { formatMoney, getVehicleById } from "@/lib/data";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = getVehicleById(id);
  if (!vehicle || vehicle.approvalStatus !== "approved") notFound();

  return (
    <div className="container-shell py-10">
      <Link href="/search" className="text-sm text-midnight/60 hover:text-gold">
        ← Back to search
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <VehiclePhoto image={vehicle.image} className="h-72 w-full rounded-2xl" />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-midnight/5 px-3 py-1 text-xs font-medium text-midnight/70">
              {vehicle.classification}
            </span>
            {vehicle.fleetSource === "internal" ? (
              <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald-dark">
                Verified Internal Fleet
              </span>
            ) : (
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold-dark">
                Partner Fleet · {vehicle.partnerName}
              </span>
            )}
            <DemoTag label="Illustrative Fleet Catalog" />
          </div>

          <h1 className="mt-4 text-3xl font-bold text-midnight">
            {vehicle.make} {vehicle.model} <span className="text-midnight/50">({vehicle.year})</span>
          </h1>
          <p className="mt-1 text-sm text-midnight/60">{vehicle.location}</p>
          <p className="mt-4 max-w-2xl text-sm text-midnight/70">{vehicle.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Spec label="Transmission" value={vehicle.transmission} />
            <Spec label="Fuel Type" value={vehicle.fuelType} />
            <Spec label="Capacity" value={`${vehicle.capacity} seats`} />
            <Spec label="Plate" value={vehicle.licensePlate} />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-midnight">Features</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <li key={f} className="rounded-full bg-white px-3 py-1 text-sm text-midnight/70 ring-1 ring-line">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-24">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-midnight">
              {formatMoney(vehicle.pricePerDay, vehicle.currency)}
            </span>
            <span className="text-sm text-midnight/60">/ day</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-midnight/60">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-amber">
              <path d="M10 1.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L10 15l-5.5 3 1.4-6.1-4.7-4.1 6.2-.6L10 1.5z" />
            </svg>
            {vehicle.rating.toFixed(1)} · {vehicle.trips} trips
          </p>

          <Link
            href={`/booking/${vehicle.id}`}
            className="mt-6 block rounded-md bg-gold px-5 py-3 text-center text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Reserve This Vehicle
          </Link>
          <p className="mt-3 text-center text-xs text-midnight/50">
            Trip details, identity verification, and a signed agreement before deposit
          </p>
        </aside>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-line">
      <div className="text-xs text-midnight/50">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-midnight">{value}</div>
    </div>
  );
}
