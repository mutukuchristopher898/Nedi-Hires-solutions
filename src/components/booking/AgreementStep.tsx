"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/types";
import { site } from "@/lib/site";
import { inputClass } from "./shared";

const SECTIONS = [
  {
    title: "1. Vehicle & Rental Period",
    body: "The renter is hiring the vehicle described in this booking for the pickup date, duration, and destination specified in Trip Details. Any extension of the rental period must be agreed with " + site.name + " in advance.",
  },
  {
    title: "2. Driver Eligibility",
    body: "For self-drive bookings, the renter confirms they meet the minimum age and driving license experience requirements declared in Trip Details, and that the license information provided is accurate.",
  },
  {
    title: "3. Condition & Liability",
    body: "The renter is responsible for traffic violations, tolls, fuel, and any damage incurred during the rental period beyond normal wear, up to the value of the security deposit and any applicable insurance excess.",
  },
  {
    title: "4. Guarantor",
    body: "The guarantor named in this booking may be contacted to confirm the renter's identity or address any outstanding obligations arising from this rental.",
  },
  {
    title: "5. Cancellations & Deposits",
    body: "The reservation deposit secures the vehicle for the agreed pickup window. Cancellation and refund terms follow " + site.name + "'s published Terms of Service.",
  },
];

export default function AgreementStep({
  saving,
  onSubmit,
}: {
  vehicle: Vehicle;
  saving: boolean;
  onSubmit: (data: { signedName: string }) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!accepted || !signedName.trim()) {
      setFormError("Please confirm you agree and type your full legal name to sign.");
      return;
    }

    onSubmit({ signedName: signedName.trim() });
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">3. Rental Agreement</h2>
      <p className="mt-2 rounded-lg bg-amber/10 p-3 text-sm text-amber">
        Placeholder draft for prototype purposes only — review with legal counsel before
        publishing a live version.
      </p>

      <div className="mt-5 max-h-64 space-y-4 overflow-y-auto rounded-lg bg-offwhite p-4">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="text-sm font-semibold text-midnight">{s.title}</h3>
            <p className="mt-1 text-sm text-midnight/70">{s.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="flex items-start gap-2 text-sm text-midnight/80">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5"
          />
          I have read and agree to this Rental Agreement.
        </label>

        <label className="block max-w-sm">
          <span className="text-xs font-medium text-midnight/60">Type your full legal name to sign</span>
          <input
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            className={inputClass}
          />
        </label>

        {formError && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Sign & Continue"}
        </button>
      </form>
    </section>
  );
}
