"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BulkAction = "hide" | "unhide" | "approve" | "relocate";

const ACTION_LABELS: Record<BulkAction, string> = {
  hide: "Hide",
  unhide: "Unhide",
  approve: "Approve",
  relocate: "Change location",
};

/**
 * Applies one action to many vehicles.
 *
 * Writes are issued per row rather than as a single `in` filter, deliberately.
 * Approval runs a trigger that can refuse an individual vehicle — one with no
 * photograph — and a bulk update would fail the whole statement on the first
 * refusal, leaving the operator with an error and no idea which rows were the
 * problem. Per-row lets the good ones through and names the ones that didn't.
 */
export default function VehicleBulkBar({
  selected,
  locations,
  onDone,
}: {
  selected: { id: string; label: string; hasPhoto: boolean }[];
  locations: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<BulkAction | null>(null);
  const [location, setLocation] = useState(locations[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (selected.length === 0) return null;

  async function apply(action: BulkAction) {
    setBusy(true);
    setError(null);
    setFailures([]);

    const patch =
      action === "hide" ? { hidden_at: new Date().toISOString() }
      : action === "unhide" ? { hidden_at: null }
      : action === "approve" ? { approval_status: "approved" }
      : { location };

    const supabase = createClient();
    const failed: string[] = [];

    for (const vehicle of selected) {
      const { data, error: updateError } = await supabase
        .from("vehicles")
        .update(patch)
        .eq("id", vehicle.id)
        .select("id");

      if (updateError || !data || data.length === 0) {
        failed.push(vehicle.label);
      }
    }

    setBusy(false);
    setPending(null);

    if (failed.length > 0) {
      setFailures(failed);
      if (failed.length === selected.length) {
        setError("None of those could be changed.");
      }
    } else {
      onDone();
    }

    router.refresh();
  }

  if (pending) {
    const noPhoto = pending === "approve" ? selected.filter((v) => !v.hasPhoto) : [];

    return (
      <div className="sticky bottom-4 z-10 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-line">
        <p className="text-sm font-medium text-midnight">
          {ACTION_LABELS[pending]} {selected.length} vehicle{selected.length === 1 ? "" : "s"}?
        </p>

        {pending === "hide" && (
          <p className="mt-1 text-sm text-midnight/60">
            They come off customer search immediately. Reversible at any time.
          </p>
        )}
        {pending === "approve" && (
          <p className="mt-1 text-sm text-midnight/60">
            They go live on the customer site straight away.
          </p>
        )}
        {pending === "approve" && noPhoto.length > 0 && (
          <p className="mt-2 rounded-md bg-amber/10 px-3 py-2 text-xs text-amber">
            {noPhoto.length} of these has no photograph and will be refused:{" "}
            {noPhoto.map((v) => v.label).join(", ")}. The rest will still go through.
          </p>
        )}

        {pending === "relocate" && (
          <label className="mt-2 block">
            <span className="text-xs font-medium text-midnight/60">Move them to</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || (pending === "relocate" && !location)}
            onClick={() => apply(pending)}
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
          >
            {busy ? "Applying…" : `Yes, ${ACTION_LABELS[pending].toLowerCase()}`}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPending(null)}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-line">
      <span className="text-sm font-medium text-midnight">
        {selected.length} selected
      </span>

      {(["approve", "hide", "unhide", "relocate"] as BulkAction[]).map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => setPending(action)}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5"
        >
          {ACTION_LABELS[action]}
        </button>
      ))}

      <button
        type="button"
        onClick={onDone}
        className="ml-auto text-xs font-medium text-midnight/50 underline hover:text-midnight"
      >
        Clear selection
      </button>

      {failures.length > 0 && (
        <p role="alert" className="w-full text-xs text-amber">
          Couldn&apos;t change: {failures.join(", ")}. The others went through.
        </p>
      )}
      {error && <p role="alert" className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
