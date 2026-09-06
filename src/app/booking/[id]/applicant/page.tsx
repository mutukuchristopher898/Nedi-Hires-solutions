"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { uploadKycFile } from "@/lib/supabase/storage";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import ApplicantDetailsStep, { type ApplicantSubmission } from "@/components/booking/ApplicantDetailsStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";

export default function ApplicantPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, patchDraft, vehicle } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockGuard();
  useRequireBookingId();

  async function handleApplicantSubmit(data: ApplicantSubmission) {
    if (!user || !draft.bookingId) return;
    setSaving(true);
    setError(null);

    const bookingId = draft.bookingId;

    try {
      const idPath = await uploadKycFile({ userId: user.id, bookingId, docSlug: "id", file: data.idFile });
      const passportPhotoPath = await uploadKycFile({
        userId: user.id,
        bookingId,
        docSlug: "passport-photo",
        file: data.passportPhotoFile,
      });
      const licensePath = data.licenseFile
        ? await uploadKycFile({ userId: user.id, bookingId, docSlug: "license", file: data.licenseFile })
        : null;

      const submitResponse = await fetch("/api/submit-applicant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationality: data.nationality,
          surname: data.surname,
          givenNames: data.givenNames,
          middleName: data.middleName,
          mononymDeclared: data.mononymDeclared,
          confirmNamesIntentionallyIdentical: data.confirmNamesIntentionallyIdentical,
          idType: data.idType,
          idNumber: data.idNumber,
          idNumberOverrideConfirmed: data.idNumberOverrideConfirmed,
          requiresLicense: data.requiresLicense,
          licenseNumber: data.licenseNumber,
          licenseNumberOverrideConfirmed: data.licenseNumberOverrideConfirmed,
          address: data.address,
          phoneNumber: data.phoneNumber,
          guarantorName: data.guarantorName,
          guarantorPhone: data.guarantorPhone,
          guarantorRelationship: data.guarantorRelationship,
          bookingId,
          dateOfBirth: draft.trip.dateOfBirth || null,
          licenseIssueDate: draft.trip.licenseIssueDate || null,
          idFilePath: idPath,
          licenseFilePath: licensePath,
          passportPhotoFilePath: passportPhotoPath,
        }),
      });

      if (!submitResponse.ok) {
        const submitResult = await submitResponse.json().catch(() => ({}));
        const firstFieldError = submitResult.fieldErrors ? Object.values(submitResult.fieldErrors)[0] : undefined;
        throw new Error((firstFieldError as string) ?? submitResult.error ?? "Could not submit your details. Please try again.");
      }

      const applicantName = `${data.givenNames} ${data.surname}`.trim();

      const verifyResponse = await fetch("/api/verify-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, storagePath: idPath }),
      });
      const verifyResult = await verifyResponse.json();

      setSaving(false);

      if (verifyResult.status === "failed") {
        setError(verifyResult.notes ?? "The uploaded document could not be verified. Please try again.");
        return;
      }

      patchDraft({
        applicant: {
          nationality: data.nationality,
          surname: data.surname,
          givenNames: data.givenNames,
          middleName: data.middleName,
          grandfatherName: draft.applicant.grandfatherName,
          mononymDeclared: data.mononymDeclared,
          confirmNamesIntentionallyIdentical: data.confirmNamesIntentionallyIdentical,
          idType: data.idType,
          idNumber: data.idNumber,
          idNumberOverrideConfirmed: data.idNumberOverrideConfirmed,
          licenseNumber: data.licenseNumber,
          licenseNumberOverrideConfirmed: data.licenseNumberOverrideConfirmed,
          address: data.address,
          phoneNumber: data.phoneNumber,
          guarantorName: data.guarantorName,
          guarantorPhone: data.guarantorPhone,
          guarantorRelationship: data.guarantorRelationship,
        },
        applicantName,
        furthestStepReached: "selfie",
      });
      router.push(`/booking/${vehicle.id}/selfie`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Could not submit your details. Please try again.");
    }
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.id} current="applicant" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}

      <ApplicantDetailsStep
        value={draft.applicant}
        onChange={(patch) => patchDraft({ applicant: { ...draft.applicant, ...patch } })}
        driveType={draft.trip.driveType}
        saving={saving}
        onSubmit={handleApplicantSubmit}
      />
    </>
  );
}
