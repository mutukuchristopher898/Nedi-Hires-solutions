"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TripDetails } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_UNAVAILABLE_MESSAGE, bookingErrorMessage } from "@/lib/bookingErrors";
import {
  combineDateAndTime,
  computePricing,
  effectiveDays,
  oneWayFee,
  reservationDeposit,
  securityDeposit,
} from "@/lib/duration";
import { useBookingDraft } from "@/lib/booking/draftStore";
import TripDetailsStep from "@/components/booking/TripDetailsStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

// Every figure sent below is only an opening estimate: enforce_booking_money()
// recomputes all of it from vehicles.price_per_day and overwrites whatever
// arrives here, so the row that comes back is the authoritative quote.
const QUOTE_COLUMNS = "id, booking_ref, rate_per_day, total_amount, deposit_amount, security_deposit, one_way_fee";

export default function TripPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, patchDraft, vehicle, vehicleDbId, feeTable } = useBookingDraft();
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
    const fee = tripData.returnToDifferentLocation ? oneWayFee(tripData.pickupPoint, tripData.dropoffPoint, feeTable) : 0;
    const total = pricing.total + fee;

    const supabase = createClient();
    const insertPayload = {
      customer_id: user.id,
      vehicle_id: vehicleDbId,
      start_date: tripData.pickupDate,
      end_date: tripData.dropoffDate,
      pickup_at: pickupAt.toISOString(),
      dropoff_at: dropoffAt.toISOString(),
      deposit_amount: reservationDeposit(total),
      total_amount: total,
      security_deposit: securityDeposit(total),
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

    // Ask first, so a customer who has lost the vehicle gets told plainly
    // instead of watching a write fail. The database still enforces this —
    // between this check and the insert the car can be taken, and that race
    // is what the exclusion constraint exists for.
    const { data: available, error: availabilityError } = await supabase.rpc("is_vehicle_available", {
      p_vehicle_id: vehicleDbId,
      p_start: insertPayload.start_date,
      p_end: insertPayload.end_date,
    });

    if (!availabilityError && available === false) {
      setSaving(false);
      setError(VEHICLE_UNAVAILABLE_MESSAGE);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("bookings")
      .insert(insertPayload)
      .select(QUOTE_COLUMNS)
      .single();

    let bookingRow = data;

    // A retry (e.g. a double-click or network retry re-submitting the same
    // idempotency key) hits the unique constraint — that's not a failure,
    // it means the original booking already exists. Fetch and continue with
    // it rather than creating a second one or showing an error.
    if (insertError?.code === "23505" && insertError.message.includes("idx_booking_idempotency")) {
      const { data: existing } = await supabase
        .from("bookings")
        .select(QUOTE_COLUMNS)
        .eq("idempotency_key", draft.idempotencyKey)
        .single();
      bookingRow = existing;
    } else if (insertError) {
      setSaving(false);
      setError(bookingErrorMessage(insertError, "Could not start your booking. Please try again."));
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
      // The server-computed figures, which override the estimate above.
      quote: {
        ratePerDay: Number(bookingRow.rate_per_day),
        total: Number(bookingRow.total_amount),
        deposit: Number(bookingRow.deposit_amount),
        securityDeposit: Number(bookingRow.security_deposit),
        oneWayFee: Number(bookingRow.one_way_fee),
      },
      furthestStepReached: "applicant",
    });
    router.push(`/booking/${vehicle.slug}/applicant`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="trip" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <TripDetailsStep
        vehicle={vehicle}
        feeTable={feeTable}
        value={draft.trip}
        onChange={(patch) => patchDraft({ trip: { ...draft.trip, ...patch } })}
        saving={saving}
        onSubmit={handleTripSubmit}
      />
    </>
  );
}
