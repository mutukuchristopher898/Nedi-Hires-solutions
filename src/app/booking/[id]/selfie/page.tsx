"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { uploadKycFile } from "@/lib/supabase/storage";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import SelfieCaptureStep from "@/components/booking/SelfieCaptureStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

export default function SelfiePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, patchDraft, vehicle } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockGuard();
  useRequireBookingId();

  async function handleSelfieSubmit(file: File) {
    if (!user || !draft.bookingId) return;
    setSaving(true);
    setError(null);

    const bookingId = draft.bookingId;

    try {
      const selfiePath = await uploadKycFile({ userId: user.id, bookingId, docSlug: "selfie", file });

      const supabase = createClient();
      const { error: docError } = await supabase.from("identity_documents").insert({
        booking_id: bookingId,
        customer_id: user.id,
        doc_type: "Selfie Verification",
        file_url: selfiePath,
        status: "pending",
      });
      if (docError) throw docError;

      await fetch("/api/verify-selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, selfieStoragePath: selfiePath }),
      });

      setSaving(false);
      patchDraft({ furthestStepReached: "agreement" });
      router.push(`/booking/${vehicle.id}/agreement`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Could not submit your selfie. Please try again.");
    }
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="selfie" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <SelfieCaptureStep saving={saving} onSubmit={handleSelfieSubmit} />
    </>
  );
}
