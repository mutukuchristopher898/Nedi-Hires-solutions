"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApprovalStatus } from "@/lib/types";

// Writes through the admin UPDATE policy on identity_documents. These used to
// be React-state-only buttons over hardcoded sample rows, so an admin's
// decision vanished on refresh and no real customer document was ever
// reviewable.
export default function DocumentReviewActions({
  documentId,
  status: initialStatus,
  reviewerId,
}: {
  documentId: string;
  status: ApprovalStatus;
  reviewerId: string;
}) {
  const [status, setStatus] = useState<ApprovalStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(next: ApprovalStatus) {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("identity_documents")
      .update({
        status: next,
        reviewed_by: next === "pending" ? null : reviewerId,
        reviewed_at: next === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", documentId);

    setSaving(false);

    if (updateError) {
      setError("Could not save. Please try again.");
      return;
    }

    setStatus(next);
  }

  return (
    <div>
      {status === "pending" ? (
        <div className="flex gap-2">
          <button
            onClick={() => review("approved")}
            disabled={saving}
            className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-60"
          >
            Validate
          </button>
          <button
            onClick={() => review("rejected")}
            disabled={saving}
            className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : (
        <button
          onClick={() => review("pending")}
          disabled={saving}
          className="text-xs font-medium text-midnight/50 transition hover:text-midnight disabled:opacity-60"
        >
          Revert to pending
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
