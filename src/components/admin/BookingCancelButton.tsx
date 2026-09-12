"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Cancelling is what releases a vehicle back to other customers, so it is the
// one booking action an operator genuinely needs. It works from here and not
// from the SQL editor because enforce_booking_status_transition() treats
// 'confirmed' as terminal for everyone except an admin — and is_admin() reads
// auth.uid(), which is null in the SQL editor but is the signed-in admin here.
export default function BookingCancelButton({
  id,
  bookingRef,
  holdsVehicle,
}: {
  id: string;
  bookingRef: string;
  holdsVehicle: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setConfirming(false);
    // The list is a server component, so re-render it rather than patching
    // local state — the vehicle-hold flags on other rows may have moved too.
    router.refresh();
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10"
        >
          Cancel booking
        </button>
        {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-md bg-red-500/5 p-3 ring-1 ring-red-500/20">
      <p className="text-xs font-medium text-midnight">
        Cancel {bookingRef}?
        {holdsVehicle && " This releases the vehicle for other customers."}
      </p>
      <p className="mt-1 text-xs text-midnight/60">
        Cancelled is a terminal state — this cannot be undone from here.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleCancel}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {saving ? "Cancelling…" : "Yes, cancel it"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => setConfirming(false)}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5 disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
