"use client";

import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import ConfirmedStep from "@/components/booking/ConfirmedStep";
import WizardNav from "@/components/booking/WizardNav";

export default function ConfirmedPage() {
  const { draft, vehicle } = useBookingDraft();

  useRequireBookingId();

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="confirmed" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />
      <ConfirmedStep bookingRef={draft.bookingRef} trip={draft.trip} />
    </>
  );
}
