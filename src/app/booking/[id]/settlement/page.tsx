"use client";

import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import WizardNav from "@/components/booking/WizardNav";
import BookingRequestStatus from "@/components/booking/BookingRequestStatus";

// Payment is arranged directly with the customer until online payment is
// ready, so this step shows the booking's status rather than a pay button.
// The previous version (pricing breakdown and a "Complete Payment" button
// that confirmed the booking without taking money) is in git history.
export default function SettlementPage() {
  const { draft, vehicle } = useBookingDraft();
  useRequireBookingId();

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="settlement" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />
      <BookingRequestStatus bookingId={draft.bookingId} />
    </>
  );
}
