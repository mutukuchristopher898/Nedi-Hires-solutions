"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DocumentStatus } from "@/lib/types";

type Outcome = "approved" | "rejected" | "returned";

const OUTCOME_COPY: Record<Exclude<Outcome, "approved">, { title: string; note: string }> = {
  returned: {
    title: "Return for a better copy",
    note: "The customer can upload again, and sees this reason. Use this when the document is probably fine but the copy isn't.",
  },
  rejected: {
    title: "Reject this document",
    note: "A decision about the document itself. The customer sees this reason but cannot replace it from here.",
  },
};

export default function DocumentReviewActions({
  documentId,
  status,
  reasons,
  emailConfigured,
}: {
  documentId: string;
  status: DocumentStatus;
  /** Editable at /admin/settings. */
  reasons: string[];
  /** Until a sending domain exists, the reason is recorded but not sent. */
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "returned" | "rejected">("idle");
  const [preset, setPreset] = useState(reasons[0] ?? "");
  const [note, setNote] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(outcome: Outcome, reason?: string) {
    setBusy(outcome);
    setError(null);

    const patch: Record<string, unknown> = { status: outcome };
    if (reason !== undefined) patch.review_reason = reason;
    // Only set on approval: an expiry on a rejected document means nothing.
    if (outcome === "approved" && expiry) patch.expires_at = expiry;

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("identity_documents")
      .update(patch)
      .eq("id", documentId)
      .select("id");

    setBusy(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("That didn't apply — you may not have permission.");
      return;
    }

    setMode("idle");
    setNote("");
    router.refresh();
  }

  if (mode !== "idle") {
    const copy = OUTCOME_COPY[mode];
    const reason = [preset, note.trim()].filter(Boolean).join(" — ");

    return (
      <div className="rounded-md bg-amber/5 p-3 ring-1 ring-amber/20">
        <p className="text-xs font-medium text-midnight">{copy.title}</p>
        <p className="mt-1 text-xs text-midnight/60">{copy.note}</p>

        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          aria-label="Reason"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        >
          {reasons.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything more specific (optional)"
          aria-label="Additional detail"
          className="mt-2 w-full rounded-md border border-line px-2 py-1.5 text-xs focus:border-gold focus:outline-none"
        />

        {!emailConfigured && (
          <p className="mt-2 rounded bg-midnight/5 px-2 py-1 text-[11px] text-midnight/60">
            This reason is saved and the customer can see it on their account, but no email is
            sent yet — that needs a sending domain.
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy !== null || !reason}
            onClick={() => decide(mode, reason)}
            className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : mode === "returned" ? "Return it" : "Reject it"}
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

  return (
    <div>
      {status !== "approved" && (
        <label className="block">
          <span className="text-[11px] font-medium text-midnight/60">Expires (optional)</span>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            aria-label="Document expiry date"
            className="mt-1 w-full rounded-md border border-line px-2 py-1 text-xs focus:border-gold focus:outline-none"
          />
        </label>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {status !== "approved" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => decide("approved")}
            className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-50"
          >
            {busy === "approved" ? "Approving…" : "Approve"}
          </button>
        )}
        {status !== "returned" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setMode("returned")}
            className="rounded-md border border-amber/40 px-3 py-1.5 text-xs font-semibold text-amber transition hover:bg-amber/10 disabled:opacity-50"
          >
            Return
          </button>
        )}
        {status !== "rejected" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setMode("rejected")}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Reject
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
