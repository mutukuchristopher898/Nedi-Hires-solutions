"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import VerificationStep from "@/components/booking/VerificationStep";
import WizardNav from "@/components/booking/WizardNav";

export default function VerificationPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();

  useRequireBookingId();

  async function handleContinueToSettlement() {
    if (draft.bookingId) {
      const supabase = createClient();
      await supabase.from("bookings").update({ status: "settlement_pending" }).eq("id", draft.bookingId);
    }
    patchDraft({ furthestStepReached: "settlement" });
    router.push(`/booking/${vehicle.id}/settlement`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="verification" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />
      <VerificationStep onContinue={handleContinueToSettlement} />
    </>
  );
}
