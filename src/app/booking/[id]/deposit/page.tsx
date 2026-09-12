"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bookingErrorMessage } from "@/lib/bookingErrors";
import {
  combineDateAndTime,
  computePricing,
  effectiveDays,
  formatDurationLabel,
  oneWayFee,
  reservationDeposit,
} from "@/lib/duration";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import DepositStep from "@/components/booking/DepositStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

export default function DepositPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle, feeTable } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockGuard();
  useRequireBookingId();

  const { trip } = draft;
  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const estimatedFee = trip.returnToDifferentLocation ? oneWayFee(trip.pickupPoint, trip.dropoffPoint, feeTable) : 0;
  const durationLabel = formatDurationLabel(trip.durationUnit, trip.durationQuantity);

  // Prefer the figures the database computed when the booking was created —
  // enforce_booking_money() is authoritative and the local calculation is
  // only a fallback for a draft that predates the quote being captured.
  const total = draft.quote?.total ?? pricing.total + estimatedFee;
  const fee = draft.quote?.oneWayFee ?? estimatedFee;
  const deposit = draft.quote?.deposit ?? reservationDeposit(total, vehicle.rates);

  async function handlePayDeposit() {
    if (!draft.bookingId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "verification_pending" })
      .eq("id", draft.bookingId);

    setSaving(false);

    if (updateError) {
      setError(bookingErrorMessage(updateError, "Could not record your deposit. Please try again."));
      return;
    }

    patchDraft({ furthestStepReached: "verification", lockedAfterPayment: true });
    router.push(`/booking/${vehicle.slug}/verification`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="deposit" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <DepositStep
        deposit={deposit}
        total={total}
        durationLabel={durationLabel}
        rateLabel={pricing.rateLabel}
        savingsAmount={pricing.savingsAmount}
        oneWayFee={fee}
        pricePerDay={vehicle.pricePerDay}
        currency={vehicle.currency}
        saving={saving}
        onSubmit={handlePayDeposit}
      />
    </>
  );
}
