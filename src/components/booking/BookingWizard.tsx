"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookingStep, TripDetails, Vehicle } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { uploadKycFile } from "@/lib/supabase/storage";
import VehiclePhoto from "../VehiclePhoto";
import TripDetailsStep from "./TripDetailsStep";
import ApplicantDetailsStep, { type ApplicantSubmission } from "./ApplicantDetailsStep";
import AgreementStep from "./AgreementStep";
import DepositStep from "./DepositStep";
import VerificationStep from "./VerificationStep";
import SettlementStep from "./SettlementStep";
import ConfirmedStep from "./ConfirmedStep";
import { Row } from "./shared";

const STEP_ORDER: BookingStep[] = [
  "trip",
  "applicant",
  "agreement",
  "deposit",
  "verification",
  "settlement",
  "confirmed",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function BookingWizard({
  vehicle,
  vehicleDbId,
}: {
  vehicle: Vehicle;
  vehicleDbId: string | null;
}) {
  const { user, ready } = useAuth();
  const [step, setStep] = useState<BookingStep>("trip");
  const [trip, setTrip] = useState<TripDetails>(() => ({
    pickupDate: todayIso(),
    pickupPoint: vehicle.location,
    destination: "",
    purpose: "personal",
    days: 3,
    driveType: "self_drive",
    dateOfBirth: "",
    licenseIssueDate: "",
  }));
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = 5000;
  const total = vehicle.pricePerDay * trip.days;
  const securityDeposit = Math.round(total * 0.15);
  const remaining = Math.max(total - deposit, 0);
  const currentIndex = STEP_ORDER.indexOf(step);

  async function handleTripSubmit(tripData: TripDetails) {
    if (!user || !vehicleDbId) return;
    setSaving(true);
    setError(null);

    const tripTotal = vehicle.pricePerDay * tripData.days;
    const tripSecurityDeposit = Math.round(tripTotal * 0.15);
    const endDate = new Date(new Date(tripData.pickupDate).getTime() + tripData.days * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        vehicle_id: vehicleDbId,
        start_date: tripData.pickupDate,
        end_date: endDate,
        deposit_amount: deposit,
        total_amount: tripTotal,
        security_deposit: tripSecurityDeposit,
        currency: vehicle.currency,
        pickup_point: tripData.pickupPoint,
        destination: tripData.destination,
        purpose: tripData.purpose,
        drive_type: tripData.driveType,
      })
      .select("id, booking_ref")
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not start your booking. Please try again.");
      return;
    }

    setTrip(tripData);
    setBookingId(data.id);
    setBookingRef(data.booking_ref);
    setStep("applicant");
  }

  async function handleApplicantSubmit(data: ApplicantSubmission) {
    if (!user || !bookingId) return;
    setSaving(true);
    setError(null);

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

      const supabase = createClient();
      const documentRows: { booking_id: string; customer_id: string; doc_type: string; file_url: string; status: string }[] = [
        { booking_id: bookingId, customer_id: user.id, doc_type: data.idType, file_url: idPath, status: "pending" },
        {
          booking_id: bookingId,
          customer_id: user.id,
          doc_type: "Passport Photo",
          file_url: passportPhotoPath,
          status: "pending",
        },
      ];
      if (licensePath) {
        documentRows.push({
          booking_id: bookingId,
          customer_id: user.id,
          doc_type: "Driver's License",
          file_url: licensePath,
          status: "pending",
        });
      }

      const { error: docsError } = await supabase.from("identity_documents").insert(documentRows);
      if (docsError) throw docsError;

      const { error: applicantError } = await supabase.from("booking_applicants").insert({
        booking_id: bookingId,
        customer_id: user.id,
        date_of_birth: trip.dateOfBirth || null,
        full_name: data.fullName,
        id_type: data.idType,
        id_number: data.idNumber,
        license_number: data.licenseNumber || null,
        license_issue_date: trip.licenseIssueDate || null,
        address: data.address,
        phone_number: data.phoneNumber,
        guarantor_name: data.guarantorName,
        guarantor_phone: data.guarantorPhone,
        guarantor_relationship: data.guarantorRelationship,
      });
      if (applicantError) throw applicantError;

      setSaving(false);
      setStep("agreement");
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Could not submit your details. Please try again.");
    }
  }

  async function handleAgreementSubmit({ signedName }: { signedName: string }) {
    if (!bookingId) return;
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
      .eq("booking_id", bookingId);

    setSaving(false);

    if (agreementError) {
      setError(agreementError.message);
      return;
    }

    setStep("deposit");
  }

  async function handlePayDeposit() {
    if (!bookingId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "verification_pending" })
      .eq("id", bookingId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep("verification");
  }

  async function handleContinueToSettlement() {
    if (bookingId) {
      const supabase = createClient();
      await supabase.from("bookings").update({ status: "settlement_pending" }).eq("id", bookingId);
    }
    setStep("settlement");
  }

  async function handleCompletePayment() {
    if (bookingId) {
      const supabase = createClient();
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    }
    setStep("confirmed");
  }

  if (!ready) return null;

  if (!user) {
    const next = `/booking/${vehicle.id}`;
    return (
      <div className="max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <h2 className="text-lg font-semibold text-midnight">Sign in to book this vehicle</h2>
        <p className="mt-2 text-sm text-midnight/60">
          Create an account or sign in so we can track your reservation, verification, and
          booking history.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/account/sign-in?next=${encodeURIComponent(next)}`}
            className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href={`/account/sign-up?next=${encodeURIComponent(next)}`}
            className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  if (!vehicleDbId) {
    return (
      <div className="max-w-md rounded-2xl bg-amber/10 p-8 text-center text-amber ring-1 ring-amber/30">
        <h2 className="text-lg font-semibold">Booking temporarily unavailable</h2>
        <p className="mt-2 text-sm text-midnight/60">
          This vehicle isn&apos;t currently open for reservations. Please check back shortly or
          contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium text-midnight/50">
            Step {currentIndex + 1} of {STEP_ORDER.length}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-midnight/10">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {step === "trip" && <TripDetailsStep vehicle={vehicle} initial={trip} saving={saving} onSubmit={handleTripSubmit} />}

        {step === "applicant" && (
          <ApplicantDetailsStep driveType={trip.driveType} saving={saving} onSubmit={handleApplicantSubmit} />
        )}

        {step === "agreement" && <AgreementStep vehicle={vehicle} saving={saving} onSubmit={handleAgreementSubmit} />}

        {step === "deposit" && (
          <DepositStep
            deposit={deposit}
            total={total}
            days={trip.days}
            pricePerDay={vehicle.pricePerDay}
            currency={vehicle.currency}
            saving={saving}
            onSubmit={handlePayDeposit}
          />
        )}

        {step === "verification" && <VerificationStep onContinue={handleContinueToSettlement} />}

        {step === "settlement" && (
          <SettlementStep
            remaining={remaining}
            securityDeposit={securityDeposit}
            currency={vehicle.currency}
            onSubmit={handleCompletePayment}
          />
        )}

        {step === "confirmed" && <ConfirmedStep bookingRef={bookingRef} trip={trip} />}
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-24">
        <VehiclePhoto image={vehicle.image} className="h-32 w-full rounded-xl" />
        <h3 className="mt-4 font-semibold text-midnight">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-midnight/60">{vehicle.location}</p>
        <div className="mt-4 border-t border-line pt-4 text-sm">
          <Row label="Rate" value={`${formatMoney(vehicle.pricePerDay, vehicle.currency)}/day`} />
          <Row label="Duration" value={`${trip.days} day(s)`} />
          <Row label="Est. total" value={formatMoney(total, vehicle.currency)} bold />
        </div>
      </aside>
    </div>
  );
}
