"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { VehicleListing } from "@/lib/types";
import type { OneWayFeeTable } from "@/lib/duration";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/data";
import { combineDateAndTime, computePricing, effectiveDays, formatDurationLabel, oneWayFee } from "@/lib/duration";
import { BookingDraftProvider, useBookingDraft } from "@/lib/booking/draftStore";
import VehiclePhoto from "@/components/VehiclePhoto";
import { Row } from "./shared";

export default function BookingShell({
  vehicle,
  vehicleDbId,
  feeTable,
  children,
}: {
  vehicle: VehicleListing;
  vehicleDbId: string | null;
  feeTable: OneWayFeeTable;
  children: ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) {
    const next = `/booking/${vehicle.slug}`;
    return (
      <div className="max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <h2 className="text-lg font-semibold text-midnight">Sign in to book this vehicle</h2>
        <p className="mt-2 text-sm text-midnight/60">
          Create an account or sign in so we can track your reservation, verification, and
          booking history.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/account/sign-in?next=${encodeURIComponent(next)}`}
            className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href={`/account/sign-up?next=${encodeURIComponent(next)}`}
            className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (!vehicleDbId) {
    return (
      <div className="max-w-md rounded-2xl bg-amber/10 p-8 text-center text-amber ring-1 ring-amber/30">
        <h2 className="text-lg font-semibold">Booking temporarily unavailable</h2>
        <p className="mt-2 text-sm text-midnight/60">
          This vehicle isn&apos;t currently open for reservations. Please check back shortly or
          contact support.
        </p>
      </div>
    );
  }

  return (
    <BookingDraftProvider vehicle={vehicle} vehicleDbId={vehicleDbId} feeTable={feeTable}>
      <BookingShellInner vehicle={vehicle}>{children}</BookingShellInner>
    </BookingDraftProvider>
  );
}

function BookingShellInner({ vehicle, children }: { vehicle: VehicleListing; children: ReactNode }) {
  const { draft, feeTable } = useBookingDraft();
  const { trip } = draft;

  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const fee = trip.returnToDifferentLocation ? oneWayFee(trip.pickupPoint, trip.dropoffPoint, feeTable) : 0;
  const total = pricing.total + fee;
  const durationLabel = formatDurationLabel(trip.durationUnit, trip.durationQuantity);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>{children}</div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-24">
        <VehiclePhoto image={vehicle.imageKey} photoPath={vehicle.photoPaths[0]} alt={`${vehicle.make} ${vehicle.model}`} className="h-32 w-full rounded-xl" />
        <h3 className="mt-4 font-semibold text-midnight">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-midnight/60">{vehicle.location}</p>
        <div className="mt-4 border-t border-line pt-4 text-sm">
          <Row label="Rate" value={`${formatMoney(vehicle.pricePerDay, vehicle.currency)}/day`} />
          <Row label="Duration" value={durationLabel} />
          {fee > 0 && <Row label="One-way fee" value={formatMoney(fee, vehicle.currency)} />}
          <Row label="Est. total" value={formatMoney(total, vehicle.currency)} bold />
        </div>
      </aside>
    </div>
  );
}
