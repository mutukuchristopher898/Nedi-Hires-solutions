import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import VehiclePhoto from "./VehiclePhoto";

export default function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition hover:shadow-lg"
    >
      <VehiclePhoto image={vehicle.image} className="h-40 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-midnight/5 px-2.5 py-0.5 text-xs font-medium text-midnight/70">
            {vehicle.classification}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-midnight/70">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber">
              <path d="M10 1.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L10 15l-5.5 3 1.4-6.1-4.7-4.1 6.2-.6L10 1.5z" />
            </svg>
            {vehicle.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="text-base font-semibold text-midnight group-hover:text-gold">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-xs text-midnight/60">{vehicle.location}</p>

        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-midnight/60">
          <span>{vehicle.transmission}</span>
          <span>·</span>
          <span>{vehicle.fuelType}</span>
          <span>·</span>
          <span>{vehicle.capacity} seats</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <span className="text-lg font-bold text-midnight">
              {formatMoney(vehicle.pricePerDay, vehicle.currency)}
            </span>
            <span className="text-xs text-midnight/60"> /day</span>
          </div>
          {vehicle.fleetSource === "partner" ? (
            <span className="text-xs text-midnight/50">via {vehicle.partnerName}</span>
          ) : (
            <span className="text-xs text-emerald-dark">Verified Fleet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
