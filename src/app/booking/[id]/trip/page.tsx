"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TripDetails } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { combineDateAndTime, computePricing, effectiveDays, oneWayFee } from "@/lib/duration";
import { useBookingDraft } from "@/lib/booking/draftStore";
import TripDetailsStep from "@/components/booking/TripDetailsStep";
import WizardNav from "@/components/booking/WizardNav";

const DEPOSIT = 5000;

export default function TripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, patchDraft, vehicle, vehicleDbId } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTripSubmit(tripData: TripDetails) {
    if (!user) return;
    setSaving(true);
    setError(null);

    const pickupAt = combineDateAndTime(tripData.pickupDate, tripData.pickupTime);
    const dropoffAt = combineDateAndTime(tripData.dropoffDate, tripData.dropoffTime);
    const days = effectiveDays(pickupAt, dropoffAt);
    const pricing = computePricing(vehicle.pricePerDay, days);
    const fee = tripData.returnToDifferentLocation ? oneWayFee(tripData.pickupPoint, tripData.dropoffPoint) : 0;
    const total = pricing.total + fee;
    const securityDeposit = Math.round(total * 0.15);

    const supabase = createClient();
    const insertPayload = {
      customer_id: user.id,
      vehicle_id: vehicleDbId,
      start_date: tripData.pickupDate,
      end_date: tripData.dropoffDate,
      pickup_at: pickupAt.toISOString(),
      dropoff_at: dropoffAt.toISOString(),
      deposit_amount: DEPOSIT,
      total_amount: total,
      security_deposit: securityDeposit,
      currency: vehicle.currency,
      pickup_point: tripData.pickupPoint,
      destination: tripData.destination,
      purpose: tripData.purpose,
      drive_type: tripData.driveType,
      dropoff_point: tripData.returnToDifferentLocation ? tripData.dropoffPoint : tripData.pickupPoint,
      one_way_fee: fee,
      duration_unit: tripData.durationUnit,
      duration_quantity: tripData.durationQuantity,
      idempotency_key: draft.idempotencyKey,
    };

    const { data, error: insertError } = await supabase.from("bookings").insert(insertPayload).select("id, booking_ref").single();

    let bookingRow = data;

    // A retry (e.g. a double-click or network retry re-submitting the same
    // idempotency key) hits the unique constraint — that's not a failure,
    // it means the original booking already exists. Fetch and continue with
    // it rather than creating a second one or showing an error.
    if (insertError?.code === "23505" && insertError.message.includes("idx_booking_idempotency")) {
      const { data: existing } = await supabase
        .from("bookings")
        .select("id, booking_ref")
        .eq("idempotency_key", draft.idempotencyKey)
        .single();
      bookingRow = existing;
    } else if (insertError) {
      setSaving(false);
      setError(insertError.message ?? "Could not start your booking. Please try again.");
      return;
    }

    setSaving(false);

    if (!bookingRow) {
      setError("Could not start your booking. Please try again.");
      return;
    }

    patchDraft({
      trip: tripData,
      bookingId: bookingRow.id,
      bookingRef: bookingRow.booking_ref,
      furthestStepReached: "applicant",
    });
    router.push(`/booking/${vehicle.id}/applicant`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="trip" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}

      <TripDetailsStep
        vehicle={vehicle}
        value={draft.trip}
        onChange={(patch) => patchDraft({ trip: { ...draft.trip, ...patch } })}
        saving={saving}
        onSubmit={handleTripSubmit}
      />
    </>
  );
}
