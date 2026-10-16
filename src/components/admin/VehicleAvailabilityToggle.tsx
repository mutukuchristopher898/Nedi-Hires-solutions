"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * The admin's Available / Not available switch for one vehicle.
 *
 * Availability is decided by an admin, not worked out from bookings (owner's
 * decision, October 2026). Not available: the vehicle stays on the site,
 * marked "Not available", and cannot be booked. Only admins can flip it; the
 * database refuses the change from anyone else.
 */
export default function VehicleAvailabilityToggle({
  id,
  isAvailable,
  canManage,
}: {
  id: string;
  isAvailable: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(isAvailable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const next = !available;
    const supabase = createClient();
    const { error: updateError } = await supabase.from("vehicles").update({ is_available: next }).eq("id", id);
    setBusy(false);
    if (updateError) {
      setError("Couldn’t change availability. Please try again.");
      return;
    }
    setAvailable(next);
    router.refresh();
  }

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-midnight">Availability</p>
          <p className="mt-0.5 text-xs text-midnight/60">
            {available
              ? "Customers can see and book this vehicle."
              : "Shown as “Not available”. Customers cannot book it."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              available ? "bg-emerald/10 text-emerald-dark" : "bg-midnight/10 text-midnight/70"
            }`}
          >
            {available ? "Available" : "Not available"}
          </span>
          {canManage && (
            <button
              type="button"
              onClick={toggle}
              disabled={busy}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-midnight transition hover:border-gold hover:text-gold-dark disabled:opacity-50"
            >
              {busy ? "Saving…" : available ? "Mark not available" : "Mark available"}
            </button>
          )}
        </div>
      </div>
      {!canManage && <p className="mt-2 text-xs text-midnight/50">Only an admin can change availability.</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
