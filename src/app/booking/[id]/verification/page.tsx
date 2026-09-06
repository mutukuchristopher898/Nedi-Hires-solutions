"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useBookingDraft, useRequireBookingId } from "@/lib/booking/draftStore";
import VerificationStep from "@/components/booking/VerificationStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

export default function VerificationPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();
  const [error, setError] = useState<string | null>(null);

  useRequireBookingId();

  async function handleContinueToSettlement() {
    if (!draft.bookingId) return;
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "settlement_pending" })
      .eq("id", draft.bookingId);

    // Previously discarded, so the wizard advanced regardless of whether the
    // write landed. A status-transition trigger can now reject this.
    if (updateError) {
      setError(updateError.message);
      return;
    }

    patchDraft({ furthestStepReached: "settlement" });
    router.push(`/booking/${vehicle.id}/settlement`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="verification" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <VerificationStep onContinue={handleContinueToSettlement} />
    </>
  );
}
