"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Confirms a booking request once the deposit has been arranged with the
// customer. Admin only: the database refuses this change from anyone else
// (supabase 7-booking-requests.sql).
export default function BookingConfirmButton({ id, bookingRef }: { id: string; bookingRef: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setSaving(true);
    setError(null);
    const { error: updateError } = await createClient().from("bookings").update({ status: "confirmed" }).eq("id", id);
    setSaving(false);
    if (updateError) {
      setError("Couldn’t confirm this booking. Please try again.");
      return;
    }
    setAsking(false);
    router.refresh();
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
      >
        Confirm booking
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <p className="max-w-xs text-xs text-midnight/70">
        Confirm {bookingRef}? Only do this once the deposit has been received.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-midnight/70 hover:text-midnight"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={saving}
          className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Confirming…" : "Yes, confirm"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
