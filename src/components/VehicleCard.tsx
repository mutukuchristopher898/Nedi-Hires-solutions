import Link from "next/link";
import type { VehicleListing } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import VehiclePhoto from "./VehiclePhoto";

export default function VehicleCard({ vehicle }: { vehicle: VehicleListing }) {
  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition hover:shadow-lg"
    >
      <VehiclePhoto
        image={vehicle.imageKey}
        photoPath={vehicle.photoPaths[0]}
        alt={`${vehicle.make} ${vehicle.model}`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="h-40 w-full"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-midnight/5 px-2.5 py-0.5 text-xs font-medium text-midnight/70">
            {vehicle.classification}
          </span>
          {/* This slot held a star rating. There is no ratings column and no
              reviews feature — the number came from the illustrative
              catalogue, and a listing nobody has hired cannot have one. The
              year is real and is what someone comparing cars actually wants. */}
          <span className="text-xs font-medium text-midnight/70">{vehicle.year}</span>
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
          {vehicle.partnerName && (
            <span className="text-xs text-midnight/50">via {vehicle.partnerName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
