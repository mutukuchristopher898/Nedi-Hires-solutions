"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { VehicleListing } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/data";
import { combineDateAndTime, computePricing, effectiveDays, formatDurationLabel } from "@/lib/duration";
import { BookingDraftProvider, useBookingDraft } from "@/lib/booking/draftStore";
import VehiclePhoto from "@/components/VehiclePhoto";
import { Row } from "./shared";

export default function BookingShell({
  vehicle,
  vehicleDbId,
  children,
}: {
  vehicle: VehicleListing;
  vehicleDbId: string | null;
  children: ReactNode;
}) {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) {
    return <StartBooking slug={vehicle.slug} />;
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
    <BookingDraftProvider vehicle={vehicle} vehicleDbId={vehicleDbId}>
      <BookingShellInner vehicle={vehicle}>{children}</BookingShellInner>
    </BookingDraftProvider>
  );
}

function BookingShellInner({ vehicle, children }: { vehicle: VehicleListing; children: ReactNode }) {
  const { draft } = useBookingDraft();
  const { trip } = draft;

  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const total = pricing.total;
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
          <Row label="Est. total" value={formatMoney(total, vehicle.currency)} bold />
        </div>
      </aside>
    </div>
  );
}

// No account needed to book. "Continue" starts a guest session (Supabase
// anonymous sign-in); the customer gives their email when they send the
// request, and that is when their account is opened. Existing customers can
// sign in instead, so the booking lands straight in their account.
function StartBooking({ slug }: { slug: string }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = `/booking/${slug}`;

  async function startAsGuest() {
    setStarting(true);
    setError(null);
    const { error: signInError } = await createClient().auth.signInAnonymously();
    if (signInError) {
      setStarting(false);
      setError("We couldn’t start your booking just now. Please try again, or message us on WhatsApp.");
    }
    // On success the page updates by itself: the session change is picked up
    // by the auth provider and the booking form appears.
  }

  return (
    <div className="max-w-md rounded-2xl bg-white p-8 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">Book this vehicle</h2>
      <p className="mt-2 text-sm text-midnight/65">
        No account needed. Add your trip and details, and send your request. We&apos;ll email you a
        link to confirm it and open your account.
      </p>
      <button
        type="button"
        onClick={startAsGuest}
        disabled={starting}
        className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
      >
        {starting ? "Starting…" : "Continue"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-5 text-center text-sm text-midnight/60">
        Already have an account?{" "}
        <Link href={`/account/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-gold-dark hover:text-gold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
