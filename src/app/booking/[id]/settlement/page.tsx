"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bookingErrorMessage } from "@/lib/bookingErrors";
import {
  combineDateAndTime,
  computePricing,
  effectiveDays,
  oneWayFee,
  reservationDeposit,
  securityDeposit,
} from "@/lib/duration";
import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import SettlementStep from "@/components/booking/SettlementStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

export default function SettlementPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle, feeTable } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRequireBookingId();

  const { trip } = draft;
  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const estimatedFee = trip.returnToDifferentLocation ? oneWayFee(trip.pickupPoint, trip.dropoffPoint, feeTable) : 0;

  // Prefer the database's figures; the local calculation is only a fallback.
  const total = draft.quote?.total ?? pricing.total + estimatedFee;
  const security = draft.quote?.securityDeposit ?? securityDeposit(total, vehicle.rates);
  // No Math.max clamp: with a percentage deposit this cannot go negative, and
  // the clamp is exactly what hid the old flat-KES-5,000 overcharge (a 3,200
  // rental asked 5,000 up front, then floored the difference to zero).
  const remaining = total - (draft.quote?.deposit ?? reservationDeposit(total, vehicle.rates));

  async function handleCompletePayment() {
    if (!draft.bookingId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", draft.bookingId);

    setSaving(false);

    // Previously discarded, which meant a rejected write still showed the
    // customer "Booking Confirmed" while the record stayed
    // settlement_pending. Now that a trigger can reject an out-of-order
    // transition, swallowing this would hide a real failure.
    if (updateError) {
      setError(bookingErrorMessage(updateError, "Could not confirm your booking. Please try again."));
      return;
    }

    patchDraft({ furthestStepReached: "confirmed" });
    router.push(`/booking/${vehicle.slug}/confirmed`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="settlement" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <SettlementStep
        remaining={remaining}
        securityDeposit={security}
        currency={vehicle.currency}
        saving={saving}
        onSubmit={handleCompletePayment}
      />
    </>
  );
}
