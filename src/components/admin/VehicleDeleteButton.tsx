"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Permanently removes a vehicle.
 *
 * Deliberately separate from archiving, which is the right answer almost
 * every time: a vehicle that has ever been hired is part of the accounts and
 * must keep existing so its bookings still resolve. This is for the other
 * case — a duplicate, a typo, a test row, a partner submission that should
 * never have been made — where archiving would leave clutter forever.
 *
 * The guard is in the database, not here. delete_vehicle() re-counts the
 * bookings inside the same transaction as the delete, so a booking placed
 * between this screen rendering and the button being pressed still stops it.
 * The count below only decides what the operator is offered.
 */
export default function VehicleDeleteButton({
  id,
  label,
  bookingCount,
  photoPaths,
  documentPaths,
  canManage,
}: {
  id: string;
  label: string;
  bookingCount: number;
  photoPaths: string[];
  documentPaths: string[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  // -1 means the count itself failed. Offering deletion then would be a guess.
  if (bookingCount < 0) {
    return (
      <p className="text-xs text-midnight/50">
        Couldn&apos;t check this vehicle&apos;s bookings, so deletion is not offered. Reload the page.
      </p>
    );
  }

  if (bookingCount > 0) {
    return (
      <p className="text-xs text-midnight/50">
        This vehicle has {bookingCount} booking{bookingCount === 1 ? "" : "s"} against it, so it
        cannot be deleted, those records would stop resolving. Archive it instead: it leaves the
        fleet and stops being bookable, and the history survives.
      </p>
    );
  }

  async function remove() {
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("delete_vehicle", { p_vehicle_id: id });

    if (rpcError) {
      setBusy(false);
      setError(rpcError.message);
      return;
    }

    if (data !== "deleted") {
      setBusy(false);
      setError(
        data === "has_bookings"
          ? "A booking was made against this vehicle just now, so it can no longer be deleted. Archive it instead."
          : data === "forbidden"
            ? "Only an admin can delete a vehicle."
            : "That vehicle no longer exists."
      );
      return;
    }

    // The row is gone; its photographs would otherwise sit in the bucket
    // forever. A failure here is not worth blocking on — the vehicle is
    // already deleted and orphaned files are a tidiness problem, not a
    // correctness one.
    if (photoPaths.length > 0) {
      await supabase.storage.from("vehicle-photos").remove(photoPaths);
    }
    // The document rows went with the vehicle via ON DELETE CASCADE, but the
    // files they pointed at are storage objects and cascade nothing.
    if (documentPaths.length > 0) {
      await supabase.storage.from("vehicle-documents").remove(documentPaths);
    }

    router.push("/admin/vehicles");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="rounded-xl bg-red-500/5 p-4 ring-1 ring-red-500/20">
        <p className="text-sm font-medium text-midnight">Delete {label} permanently?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-midnight/70">
          <li>The vehicle record is removed from the database and cannot be recovered</li>
          <li>Its photographs and uploaded documents are deleted from storage</li>
          <li>It disappears from the partner&apos;s dashboard without explanation</li>
        </ul>
        <p className="mt-3 text-xs text-midnight/60">
          If you only want it off the site, cancel and archive it instead.
        </p>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-midnight/60">
            Type the registration <strong>{label}</strong> to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            aria-label="Type the registration to confirm deletion"
            className="mt-1 w-full max-w-xs rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || typed.trim().toUpperCase() !== label.toUpperCase()}
            onClick={remove}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setConfirming(false);
              setTyped("");
              setError(null);
            }}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Cancel
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/5"
      >
        Delete permanently
      </button>
      <p className="mt-1.5 text-xs text-midnight/50">
        No bookings reference this vehicle, so it can still be removed outright.
      </p>
    </div>
  );
}
