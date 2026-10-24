"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bookingErrorMessage } from "@/lib/bookingErrors";
import {
  combineDateAndTime,
  computePricing,
  effectiveDays,
  formatDurationLabel,
  reservationDeposit,
} from "@/lib/duration";
import { useBookingDraft, useLockGuard, useRequireBookingId } from "@/lib/booking/draftStore";
import DepositStep from "@/components/booking/DepositStep";
import WizardNav from "@/components/booking/WizardNav";
import { FormError } from "@/components/booking/shared";
import { useAuth } from "@/lib/auth";
import { GUEST_CLAIM_KEY, GUEST_EMAIL_KEY, authReturnUrl, isGuestUser, remember } from "@/lib/booking/guest";

export default function DepositPage() {
  const router = useRouter();
  const { draft, patchDraft, vehicle } = useBookingDraft();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const guest = isGuestUser(user);
  const [email, setEmail] = useState("");

  useLockGuard();
  useRequireBookingId();

  const { trip } = draft;
  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const durationLabel = formatDurationLabel(trip.durationUnit, trip.durationQuantity);

  // Prefer the figures the database computed when the booking was created —
  // enforce_booking_money() is authoritative and the local calculation is
  // only a fallback for a draft that predates the quote being captured.
  const total = draft.quote?.total ?? pricing.total;
  const fee = draft.quote?.oneWayFee ?? 0;
  const deposit = draft.quote?.deposit ?? reservationDeposit(total, vehicle.rates);

  async function handlePayDeposit() {
    if (!draft.bookingId) return;
    const contactEmail = guest ? email.trim().toLowerCase() : (user?.email ?? "");
    if (guest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError("Please enter a valid email address, so we can send your booking link.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    // 1. Send the request, with the email staff will reply to.
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "verification_pending", contact_email: contactEmail || null })
      .eq("id", draft.bookingId);
    if (updateError) {
      setSaving(false);
      setError(bookingErrorMessage(updateError, "We couldn’t send your request. Please try again."));
      return;
    }

    // 2. A guest's account is opened from this email: Supabase sends a link
    //    to confirm it, and the same account becomes permanent when clicked.
    if (guest) {
      remember(GUEST_EMAIL_KEY, contactEmail);
      const { error: emailError } = await supabase.auth.updateUser(
        { email: contactEmail, data: { needs_password: true } },
        { emailRedirectTo: authReturnUrl("/account/welcome") },
      );
      if (emailError) {
        const taken = emailError.code === "email_exists" || /already|registered|exists/i.test(emailError.message);
        if (taken) {
          // The request is already sent; this only lets them move it into
          // the account they already have, after signing in.
          const { data: token } = await supabase.rpc("create_guest_claim");
          if (typeof token === "string") remember(GUEST_CLAIM_KEY, token);
        }
        // Any other email problem is not fatal: the request is with us, and
        // the status page offers WhatsApp. Nothing to show the customer here.
      }
    }

    setSaving(false);
    patchDraft({ furthestStepReached: "verification", lockedAfterPayment: true });
    router.push(`/booking/${vehicle.slug}/verification`);
  }

  return (
    <>
      <WizardNav vehicleId={vehicle.slug} current="deposit" furthest={draft.furthestStepReached} locked={draft.lockedAfterPayment} />

      {error && <FormError message={error} className="mb-4" />}
      {guest && (
        <div className="mb-4 rounded-2xl bg-white p-6 ring-1 ring-line">
          <label className="block">
            <span className="text-sm font-semibold text-midnight">Your email</span>
            <span className="mt-0.5 block text-xs text-midnight/60">
              We&apos;ll email you a link to confirm your booking and open your account.
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="e.g. jane.wanjiru@example.com"
              className="mt-3 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-midnight outline-none focus:border-gold"
            />
          </label>
        </div>
      )}

      <DepositStep
        deposit={deposit}
        total={total}
        durationLabel={durationLabel}
        rateLabel={pricing.rateLabel}
        savingsAmount={pricing.savingsAmount}
        oneWayFee={fee}
        pricePerDay={vehicle.pricePerDay}
        currency={vehicle.currency}
        saving={saving}
        onSubmit={handlePayDeposit}
      />
    </>
  );
}
