"use client";

import { useState } from "react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import VehiclePhoto from "./VehiclePhoto";

type Step = "deposit" | "verification" | "settlement" | "confirmed";

const STEP_ORDER: Step[] = ["deposit", "verification", "settlement", "confirmed"];
const STEP_LABELS: Record<Step, string> = {
  deposit: "Reservation & Deposit",
  verification: "Identity Verification",
  settlement: "Final Settlement",
  confirmed: "Confirmed",
};

export default function BookingWizard({
  vehicle,
  vehicleDbId,
}: {
  vehicle: Vehicle;
  vehicleDbId: string | null;
}) {
  const { user, ready } = useAuth();
  const [step, setStep] = useState<Step>("deposit");
  const [days, setDays] = useState(3);
  const [docType, setDocType] = useState("International Passport");
  const [fileName, setFileName] = useState<string | null>(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = 5000;
  const total = vehicle.pricePerDay * days;
  const securityDeposit = Math.round(total * 0.15);
  const remaining = Math.max(total - deposit, 0);
  const money = (amount: number) => formatMoney(amount, vehicle.currency);

  const currentIndex = STEP_ORDER.indexOf(step);

  async function handlePayDeposit() {
    if (!user || !vehicleDbId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 86_400_000);

    const { data, error: insertError } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        vehicle_id: vehicleDbId,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
        status: "verification_pending",
        deposit_amount: deposit,
        total_amount: total,
        security_deposit: securityDeposit,
        currency: vehicle.currency,
      })
      .select("id, booking_ref")
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not create your booking. Please try again.");
      return;
    }

    setBookingId(data.id);
    setBookingRef(data.booking_ref);
    setStep("verification");
  }

  async function handleSubmitVerification() {
    if (!user || !bookingId) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: docError } = await supabase.from("identity_documents").insert({
      booking_id: bookingId,
      customer_id: user.id,
      doc_type: docType,
      file_url: fileName ?? "uploaded-document",
      status: "pending",
    });

    setSaving(false);

    if (docError) {
      setError(docError.message);
      return;
    }

    setVerificationSubmitted(true);
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
        <ol className="mb-8 flex flex-wrap gap-4">
          {STEP_ORDER.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  i < currentIndex
                    ? "bg-emerald text-white"
                    : i === currentIndex
                    ? "bg-gold text-midnight"
                    : "bg-midnight/10 text-midnight/50"
                }`}
              >
                {i < currentIndex ? "✓" : i + 1}
              </span>
              <span
                className={`text-sm ${
                  i === currentIndex ? "font-semibold text-midnight" : "text-midnight/50"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </li>
          ))}
        </ol>

        {error && (
          <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {step === "deposit" && (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="text-lg font-semibold text-midnight">1. Reservation & Deposit</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Choose your rental length and pay a reservation deposit to temporarily hold this vehicle.
            </p>

            <label className="mt-5 block max-w-xs">
              <span className="text-xs font-medium text-midnight/60">Rental duration (days)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </label>

            <div className="mt-5 rounded-lg bg-offwhite p-4 text-sm">
              <Row label={`${formatMoney(vehicle.pricePerDay, vehicle.currency)} × ${days} day(s)`} value={money(total)} />
              <Row label="Reservation deposit due now" value={money(deposit)} bold />
            </div>

            <button
              onClick={handlePayDeposit}
              disabled={saving}
              className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Processing…" : `Pay Deposit — ${money(deposit)}`}
            </button>
          </section>
        )}

        {step === "verification" && (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="text-lg font-semibold text-midnight">2. Identity Verification Queue</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Upload valid identification so an admin or partner can validate your credentials
              before final settlement.
            </p>

            {!verificationSubmitted ? (
              <div className="mt-5 space-y-4">
                <label className="block max-w-sm">
                  <span className="text-xs font-medium text-midnight/60">Document Type</span>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  >
                    <option>International Passport</option>
                    <option>Driver&apos;s License</option>
                    <option>National ID</option>
                  </select>
                </label>

                <label className="block max-w-sm">
                  <span className="text-xs font-medium text-midnight/60">Upload Document</span>
                  <input
                    type="file"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                    className="mt-1 block w-full text-sm text-midnight/70"
                  />
                  {fileName && <p className="mt-1 text-xs text-emerald-dark">Selected: {fileName}</p>}
                </label>

                <button
                  onClick={handleSubmitVerification}
                  disabled={!fileName || saving}
                  className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:cursor-not-allowed disabled:bg-midnight/20 disabled:text-midnight/50"
                >
                  {saving ? "Submitting…" : "Submit for Verification"}
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-amber/10 p-4 text-sm text-amber">
                <p className="font-medium">Pending Admin Review</p>
                <p className="mt-1 text-midnight/60">
                  Your {docType.toLowerCase()} was submitted and is awaiting validation.
                  In production, an admin or partner reviews this from the internal queue.
                </p>
                <button
                  onClick={handleContinueToSettlement}
                  className="mt-4 rounded-md bg-emerald px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-dark"
                >
                  Simulate Admin Approval → Continue
                </button>
              </div>
            )}
          </section>
        )}

        {step === "settlement" && (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <h2 className="text-lg font-semibold text-midnight">3. Final Settlement</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Your identity is verified. Settle the remaining rental amount and security deposit
              online or at the physical vehicle handoff.
            </p>

            <div className="mt-5 rounded-lg bg-offwhite p-4 text-sm">
              <Row label="Remaining rental balance" value={money(remaining)} />
              <Row label="Security deposit (refundable)" value={money(securityDeposit)} />
              <Row label="Total due" value={money(remaining + securityDeposit)} bold />
            </div>

            <button
              onClick={handleCompletePayment}
              className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white sm:w-auto"
            >
              Complete Payment
            </button>
          </section>
        )}

        {step === "confirmed" && (
          <section className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10 text-2xl text-emerald-dark">
              ✓
            </div>
            <h2 className="mt-4 text-xl font-semibold text-midnight">Booking Confirmed</h2>
            <p className="mt-1 text-sm text-midnight/60">
              Reference <span className="font-mono font-medium text-midnight">{bookingRef}</span>.
              A confirmation email with your receipt and pickup instructions has been sent.
            </p>
            <Link
              href="/account"
              className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
            >
              View My Bookings
            </Link>
          </section>
        )}
      </div>

      <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-24">
        <VehiclePhoto image={vehicle.image} className="h-32 w-full rounded-xl" />
        <h3 className="mt-4 font-semibold text-midnight">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-midnight/60">{vehicle.location}</p>
        <div className="mt-4 border-t border-line pt-4 text-sm">
          <Row label="Rate" value={`${formatMoney(vehicle.pricePerDay, vehicle.currency)}/day`} />
          <Row label="Duration" value={`${days} day(s)`} />
          <Row label="Est. total" value={money(total)} bold />
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "font-semibold text-midnight" : "text-midnight/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
