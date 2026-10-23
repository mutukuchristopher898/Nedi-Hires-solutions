"use client";

import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import WizardNav from "@/components/booking/WizardNav";
import BookingRequestStatus from "@/components/booking/BookingRequestStatus";

// After "Send booking request": the request's status. The customer can no
// longer move the booking on themselves; an admin confirms it once the
// deposit is arranged (supabase 7-booking-requests.sql).
export default function VerificationPage() {
  const { draft, vehicle } = useBookingDraft();
  useRequireBookingId();

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="verification" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />
      <BookingRequestStatus bookingId={draft.bookingId} />
    </>
  );
}
