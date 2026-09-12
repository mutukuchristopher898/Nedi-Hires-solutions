"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VehicleApprovalActions({
  id,
  label,
  hasPhoto,
}: {
  id: string;
  label: string;
  hasPhoto: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(status: "approved" | "rejected") {
    setSaving(status);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({ approval_status: status })
      .eq("id", id);

    setSaving(null);

    if (updateError) {
      // The database refuses to approve a vehicle with no photograph
      // (20260912090000). Say what to do rather than showing the raw error.
      setError(
        updateError.message.includes("photograph")
          ? "This vehicle has no photograph, so it can't go live. Ask the partner to add one."
          : updateError.message
      );
      return;
    }

    router.refresh();
  }

  return (
    <div className="shrink-0">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving !== null || !hasPhoto}
          onClick={() => decide("approved")}
          title={hasPhoto ? undefined : "Needs a photograph before it can be approved"}
          aria-label={`Approve ${label}`}
          className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-50"
        >
          {saving === "approved" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => decide("rejected")}
          aria-label={`Reject ${label}`}
          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {saving === "rejected" ? "Rejecting…" : "Reject"}
        </button>
      </div>
      {!hasPhoto && (
        <p className="mt-1 max-w-48 text-xs text-amber">No photograph — can&apos;t be approved.</p>
      )}
      {error && <p role="alert" className="mt-1 max-w-48 text-xs text-red-600">{error}</p>}
    </div>
  );
}
