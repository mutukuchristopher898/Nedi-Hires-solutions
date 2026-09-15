import type { VehicleListing } from "@/lib/types";

const STYLES: Record<VehicleListing["status"], string> = {
  available: "bg-emerald/10 text-emerald-dark ring-emerald/30",
  verified: "bg-gold/10 text-gold-dark ring-gold/30",
  unavailable: "bg-midnight/5 text-midnight/50 ring-midnight/10",
};

const LABELS: Record<VehicleListing["status"], string> = {
  available: "Available",
  verified: "Verified",
  unavailable: "Unavailable for your dates",
};

/**
 * Sits where the vehicle's location used to.
 *
 * Location came off the card deliberately: vehicles are sourced rather than
 * parked at a branch, so naming a town implied a constraint that does not
 * exist and invited a customer to rule out a car we would happily bring to
 * them. Where it is matters far less than whether they can have it.
 */
export default function VehicleStatus({
  status,
  className = "",
}: {
  status: VehicleListing["status"];
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STYLES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
