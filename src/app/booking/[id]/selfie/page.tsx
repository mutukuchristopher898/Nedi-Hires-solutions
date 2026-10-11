"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { uploadKycFile } from "@/lib/supabase/storage";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import SelfieCaptureStep from "@/components/booking/SelfieCaptureStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";
import { SELFIE_VERIFICATION_ENABLED } from "@/lib/features";

// The selfie step can be switched off in src/lib/features.ts. When it is, this
// page only exists to move anyone who reaches it (a bookmark, a back button,
// a booking started before the switch) on to the rental agreement.
export default function SelfiePage() {
  return SELFIE_VERIFICATION_ENABLED ? <SelfieStepPage /> : <SkipSelfie />;
}

function SkipSelfie() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();

  useEffect(() => {
    if (draft.lockedAfterPayment) {
      router.replace(`/booking/${vehicle.slug}/verification`);
      return;
    }
    if (draft.furthestStepReached === "selfie") {
      patchDraft({ furthestStepReached: "agreement" });
    }
    router.replace(`/booking/${vehicle.slug}/agreement`);
  }, [draft.lockedAfterPayment, draft.furthestStepReached, patchDraft, router, vehicle.slug]);

  return (
    <div className="py-20 text-center text-sm text-midnight/60">Taking you to the rental agreement…</div>
  );
}

function SelfieStepPage() {
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
      const selfiePath = await uploadKycFile({ bookingId, docSlug: "selfie", file });

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
      router.push(`/booking/${vehicle.slug}/agreement`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Could not submit your selfie. Please try again.");
    }
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="selfie" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <SelfieCaptureStep saving={saving} onSubmit={handleSelfieSubmit} />
    </>
  );
}
