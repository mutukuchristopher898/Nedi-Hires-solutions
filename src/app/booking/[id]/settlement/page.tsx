"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { combineDateAndTime, computePricing, effectiveDays, oneWayFee } from "@/lib/duration";
import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import SettlementStep from "@/components/booking/SettlementStep";
import WizardNav from "@/components/booking/WizardNav";

const DEPOSIT = 5000;

export default function SettlementPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();

  useRequireBookingId();

  const { trip } = draft;
  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days);
  const fee = trip.returnToDifferentLocation ? oneWayFee(trip.pickupPoint, trip.dropoffPoint) : 0;
  const total = pricing.total + fee;
  const securityDeposit = Math.round(total * 0.15);
  const remaining = Math.max(total - DEPOSIT, 0);

  async function handleCompletePayment() {
    if (draft.bookingId) {
      const supabase = createClient();
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", draft.bookingId);
    }
    patchDraft({ furthestStepReached: "confirmed" });
    router.push(`/booking/${vehicle.id}/confirmed`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="settlement" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />
      <SettlementStep
        remaining={remaining}
        securityDeposit={securityDeposit}
        currency={vehicle.currency}
        onSubmit={handleCompletePayment}
      />
    </>
  );
}
