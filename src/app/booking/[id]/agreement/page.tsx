"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import AgreementStep from "@/components/booking/AgreementStep";
import WizardNav from "@/components/booking/WizardNav";

export default function AgreementPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockGuard();
  useRequireBookingId();

  async function handleAgreementSubmit({ signedName }: { signedName: string }) {
    if (!draft.bookingId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: agreementError } = await supabase
      .from("booking_applicants")
      .update({
        agreement_accepted: true,
        agreement_signed_name: signedName,
        agreement_accepted_at: new Date().toISOString(),
      })
      .eq("booking_id", draft.bookingId);

    setSaving(false);

    if (agreementError) {
      setError(agreementError.message);
      return;
    }

    patchDraft({ furthestStepReached: "deposit" });
    router.push(`/booking/${vehicle.id}/deposit`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="agreement" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}

      <AgreementStep vehicle={vehicle} applicantName={draft.applicantName} saving={saving} onSubmit={handleAgreementSubmit} />
    </>
  );
}
