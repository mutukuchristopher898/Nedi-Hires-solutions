"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VehicleLifecycle } from "@/lib/supabase/queries";

// Preset reasons, with free text alongside. Configurable from a Settings
// screen later — until that exists, these are the ones that come up.
const REJECTION_REASONS = [
  "Photos are unclear or don't show the vehicle",
  "Registration number doesn't match the documents",
  "Price is outside what we can list",
  "Vehicle doesn't meet our condition standard",
  "Missing or expired documentation",
];

type Busy = "approve" | "reject" | "hide" | "unhide" | "archive" | null;

export default function VehicleLifecycleActions({
  id,
  label,
  lifecycle,
  hasPhoto,
  canManage,
}: {
  id: string;
  label: string;
  lifecycle: VehicleLifecycle;
  hasPhoto: boolean;
  /** Archiving is admin-only; staff can do everything else here. */
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"idle" | "rejecting" | "archiving">("idle");
  const [reasonPreset, setReasonPreset] = useState(REJECTION_REASONS[0]);
  const [reasonNote, setReasonNote] = useState("");

  async function patch(action: Busy, values: Record<string, unknown>) {
    setBusy(action);
    setError(null);

    const supabase = createClient();
    // Asking for the row back: an update that matches nothing is a success as
    // far as PostgREST is concerned, so without this a permissions change
    // would turn these into buttons that quietly do nothing.
    const { data, error: updateError } = await supabase
      .from("vehicles")
      .update(values)
      .eq("id", id)
      .select("id");

    setBusy(null);

    if (updateError) {
      setError(updateError.message);
      return false;
    }
    if (!data || data.length === 0) {
      setError("That didn't apply — you may not have permission.");
      return false;
    }

    setMode("idle");
    router.refresh();
    return true;
  }

  if (mode === "rejecting") {
    const reason = [reasonPreset, reasonNote.trim()].filter(Boolean).join(" — ");
    return (
      <div className="min-w-64 rounded-md bg-red-500/5 p-3 ring-1 ring-red-500/20">
        <p className="text-xs font-medium text-midnight">Why is {label} being rejected?</p>
        <p className="mt-1 text-xs text-midnight/50">The partner sees this, so make it actionable.</p>

        <select
          value={reasonPreset}
          onChange={(e) => setReasonPreset(e.target.value)}
          aria-label="Rejection reason"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        >
          {REJECTION_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <textarea
          rows={2}
          value={reasonNote}
          onChange={(e) => setReasonNote(e.target.value)}
          placeholder="Anything more specific (optional)"
          aria-label="Additional detail"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        />

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("reject", { approval_status: "rejected", rejection_reason: reason })}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Cancel
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (mode === "archiving") {
    return (
      <div className="min-w-64 rounded-md bg-red-500/5 p-3 ring-1 ring-red-500/20">
        <p className="text-xs font-medium text-midnight">Archive {label}?</p>
        <p className="mt-1 text-xs text-midnight/60">
          It leaves the fleet and stops being bookable. Past bookings and invoices that reference
          it are kept, so nothing in your records breaks. This is not reversible from here.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("archive", { archived_at: new Date().toISOString() })}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy === "archive" ? "Archiving…" : "Yes, archive it"}
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5"
          >
            Keep it
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap justify-end gap-2">
        {lifecycle === "pending" && (
          <>
            <button
              type="button"
              disabled={busy !== null || !hasPhoto}
              onClick={() => patch("approve", { approval_status: "approved" })}
              title={hasPhoto ? undefined : "Needs a photograph before it can be approved"}
              className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-50"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setMode("rejecting")}
              className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}

        {lifecycle === "rejected" && (
          <button
            type="button"
            disabled={busy !== null || !hasPhoto}
            onClick={() => patch("approve", { approval_status: "approved" })}
            className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-50"
          >
            {busy === "approve" ? "Approving…" : "Approve after all"}
          </button>
        )}

        {lifecycle === "live" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("hide", { hidden_at: new Date().toISOString() })}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5 disabled:opacity-50"
          >
            {busy === "hide" ? "Hiding…" : "Hide"}
          </button>
        )}

        {lifecycle === "hidden" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("unhide", { hidden_at: null })}
            className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-50"
          >
            {busy === "unhide" ? "Restoring…" : "Unhide"}
          </button>
        )}

        {canManage && lifecycle !== "archived" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setMode("archiving")}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Archive
          </button>
        )}
      </div>

      {!hasPhoto && lifecycle === "pending" && (
        <p className="mt-1 max-w-48 text-right text-xs text-amber">
          No photograph — can&apos;t be approved.
        </p>
      )}
      {error && <p role="alert" className="mt-1 max-w-56 text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
