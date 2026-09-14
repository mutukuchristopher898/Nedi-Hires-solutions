"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentPreview from "@/components/admin/DocumentPreview";
import { createClient } from "@/lib/supabase/client";
import type { VehicleDocument, VehicleDocumentStatus } from "@/lib/supabase/queries";

type Outcome = "approved" | "rejected" | "returned";

const STATUS_STYLES: Record<VehicleDocumentStatus, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  returned: "bg-charcoal-soft/10 text-charcoal-soft ring-1 ring-charcoal-soft/30",
};

const STATUS_LABELS: Record<VehicleDocumentStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned to partner",
};

const OUTCOME_COPY: Record<Exclude<Outcome, "approved">, { title: string; note: string }> = {
  returned: {
    title: "Return for a better copy",
    note: "The partner can upload again and sees this reason. Use it when the document is probably fine but the copy isn't.",
  },
  rejected: {
    title: "Reject this document",
    note: "A decision about the document itself. The partner sees this reason but cannot replace it from here.",
  },
};

const EXPIRY_WARNING_DAYS = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(date: string) {
  const then = new Date(`${date}T00:00:00Z`).getTime();
  const now = new Date().setUTCHours(0, 0, 0, 0);
  return Math.round((then - now) / 86_400_000);
}

export default function VehicleDocumentReview({
  documents,
  expectedTypes,
  reasons,
  canReview,
}: {
  documents: VehicleDocument[];
  /** Editable at /admin/settings — what this vehicle ought to have on file. */
  expectedTypes: string[];
  reasons: string[];
  canReview: boolean;
}) {
  // What is missing is as much a part of the review as what was uploaded, and
  // it is the half nobody notices: a screen listing two approved documents
  // looks finished whether or not a third was ever asked for.
  const held = new Set(documents.filter((d) => d.status !== "rejected").map((d) => d.docType));
  const missing = expectedTypes.filter((t) => !held.has(t));

  return (
    <div>
      {missing.length > 0 && (
        <p className="mb-4 rounded-md bg-amber/10 px-4 py-3 text-sm text-amber">
          Nothing on file for: <strong>{missing.join(", ")}</strong>. Approving the vehicle is still
          possible — it is your call — but this is a car going on the site without proof of
          ownership or cover.
        </p>
      )}

      {documents.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-midnight/60 ring-1 ring-line">
          The partner has not uploaded any paperwork for this vehicle.
        </p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} reasons={reasons} canReview={canReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  reasons,
  canReview,
}: {
  doc: VehicleDocument;
  reasons: string[];
  canReview: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "returned" | "rejected">("idle");
  const [preset, setPreset] = useState(reasons[0] ?? "");
  const [note, setNote] = useState("");
  const [expiry, setExpiry] = useState(doc.expiresAt ?? "");
  const [busy, setBusy] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expiresIn = doc.expiresAt ? daysUntil(doc.expiresAt) : null;

  async function decide(outcome: Outcome, reason?: string) {
    setBusy(outcome);
    setError(null);

    const patch: Record<string, unknown> = { status: outcome };
    if (reason !== undefined) patch.review_reason = reason;
    // Only meaningful on approval: an expiry date on a rejected document says
    // nothing about anything.
    if (outcome === "approved") patch.expires_at = expiry || null;

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("vehicle_documents")
      .update(patch)
      .eq("id", doc.id)
      .select("id");

    setBusy(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    // PostgREST reports an update matching no rows as a success. Without this
    // the screen would claim a decision was recorded when RLS refused it.
    if (!data || data.length === 0) {
      setError("That didn't save — you may not have permission to review this document.");
      return;
    }

    setMode("idle");
    setNote("");
    router.refresh();
  }

  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <DocumentPreview signedUrl={doc.signedUrl} path={doc.filePath} docType={doc.docType} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-midnight">{doc.docType}</h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
            >
              {STATUS_LABELS[doc.status]}
            </span>
            {expiresIn !== null && expiresIn < 0 && (
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-500/30">
                expired
              </span>
            )}
            {expiresIn !== null && expiresIn >= 0 && expiresIn <= EXPIRY_WARNING_DAYS && (
              <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber ring-1 ring-amber/30">
                expires in {expiresIn} day{expiresIn === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-midnight/40">
            Uploaded {formatDate(doc.submittedAt)}
            {doc.expiresAt ? ` · expires ${formatDate(doc.expiresAt)}` : ""}
            {doc.reviewedAt ? ` · reviewed ${formatDate(doc.reviewedAt)}` : ""}
          </p>

          {doc.reviewReason && (
            <p className="mt-2 rounded-md bg-amber/5 px-2 py-1 text-xs text-amber">
              Reason given: {doc.reviewReason}
            </p>
          )}

          {doc.status === "approved" && !doc.expiresAt && (
            <p className="mt-2 rounded-md bg-midnight/5 px-2 py-1 text-xs text-midnight/60">
              No expiry recorded. Fine for a logbook; for insurance or an inspection it means
              nothing will warn you when it lapses.
            </p>
          )}

          {!canReview ? (
            <p className="mt-3 text-xs text-midnight/50">
              Reviewing documents needs an admin account.
            </p>
          ) : mode === "idle" ? (
            <div className="mt-3">
              <label className="block max-w-xs">
                <span className="text-xs font-medium text-midnight/60">
                  Expiry date{" "}
                  <span className="font-normal text-midnight/40">(leave blank if none)</span>
                </span>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  aria-label={`Expiry date for ${doc.docType}`}
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => decide("approved")}
                  className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-dark disabled:opacity-60"
                >
                  {busy === "approved" ? "Approving…" : doc.status === "approved" ? "Re-save expiry" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setMode("returned")}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5"
                >
                  Return
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => setMode("rejected")}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-offwhite p-3">
              <p className="text-xs font-semibold text-midnight">{OUTCOME_COPY[mode].title}</p>
              <p className="mt-1 text-xs text-midnight/60">{OUTCOME_COPY[mode].note}</p>

              <label className="mt-2 block">
                <span className="text-xs font-medium text-midnight/60">Reason</span>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  aria-label="Reason"
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                >
                  {reasons.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>

              <label className="mt-2 block">
                <span className="text-xs font-medium text-midnight/60">
                  Anything to add <span className="font-normal text-midnight/40">(optional)</span>
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  aria-label="Additional note"
                  className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy !== null || !preset}
                  onClick={() => decide(mode, [preset, note.trim()].filter(Boolean).join(" — "))}
                  className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
                >
                  {busy ? "Saving…" : mode === "returned" ? "Return it" : "Reject it"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    setMode("idle");
                    setError(null);
                  }}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-midnight/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
