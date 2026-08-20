"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export default function PartnerQuotePage() {
  const { user, profile, ready } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? "");
  const [vehicleCount, setVehicleCount] = useState(6);
  const [vehicleTypes, setVehicleTypes] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = contactEmail || user?.email || "";

  if (!ready) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("quote_requests").insert({
      requester_profile_id: user!.id,
      business_name: businessName,
      contact_email: email,
      contact_phone: contactPhone,
      vehicle_count: vehicleCount,
      vehicle_types: vehicleTypes || null,
      notes: notes || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="container-shell max-w-md py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-2xl text-amber">
          ⏳
        </div>
        <h1 className="mt-4 text-xl font-semibold text-midnight">Quote Request Submitted</h1>
        <p className="mt-2 text-sm text-midnight/60">
          Thanks — our team will review your fleet size and reach out with a custom quote
          shortly.
        </p>
        <Link
          href="/partners/dashboard"
          className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
        >
          Go to Partner Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell max-w-lg py-14">
      <h1 className="text-2xl font-bold text-midnight">Request a Custom Quote</h1>
      <p className="mt-1 text-sm text-midnight/60">
        For partners listing more vehicles than our standard tier covers — tell us about your
        fleet and we&apos;ll follow up with pricing.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Business Name</span>
          <input
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Contact Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Contact Phone</span>
          <input
            required
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Number of Vehicles</span>
          <input
            required
            type="number"
            min={1}
            value={vehicleCount}
            onChange={(e) => setVehicleCount(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Vehicle Types</span>
          <input
            value={vehicleTypes}
            onChange={(e) => setVehicleTypes(e.target.value)}
            placeholder="e.g. 3 SUVs, 4 vans"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Anything else we should know?</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Quote Request"}
        </button>
      </form>
    </div>
  );
}
