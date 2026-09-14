"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";
import type { VehicleDocument, VehicleDocumentStatus } from "@/lib/supabase/queries";

const STATUS_STYLES: Record<VehicleDocumentStatus, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  returned: "bg-charcoal-soft/10 text-charcoal-soft ring-1 ring-charcoal-soft/30",
};

const STATUS_LABELS: Record<VehicleDocumentStatus, string> = {
  pending: "Being reviewed",
  approved: "Accepted",
  rejected: "Not accepted",
  returned: "Needs replacing",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The paperwork a partner supplies for one of their vehicles.
 *
 * Collapsed by default: most of the time a partner is here to check on a
 * listing, not to re-read documents they already sent. It opens itself when
 * something actually needs them — a returned document, or a type with nothing
 * on file at all.
 */
export default function VehicleDocumentsPanel({
  vehicleId,
  vehicleLabel,
  documents,
  expectedTypes,
}: {
  vehicleId: string;
  vehicleLabel: string;
  documents: VehicleDocument[];
  expectedTypes: string[];
}) {
  // A rejected document does not count as held: the partner has to send
  // another one, and showing the type as covered would be telling them the
  // opposite of what is true.
  const held = new Set(documents.filter((d) => d.status !== "rejected").map((d) => d.docType));
  const missing = expectedTypes.filter((t) => !held.has(t));
  const needsAction = documents.some((d) => d.status === "returned") || missing.length > 0;

  const [open, setOpen] = useState(needsAction);

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-semibold text-midnight">
          Documents
          {needsAction && (
            <span className="ml-2 rounded-full bg-amber/10 px-2 py-0.5 text-xs font-medium text-amber">
              action needed
            </span>
          )}
          {!needsAction && documents.length > 0 && (
            <span className="ml-2 text-xs font-normal text-midnight/50">
              {documents.length} on file
            </span>
          )}
        </span>
        <span className="text-xs text-midnight/40">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-3">
          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-offwhite px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-midnight">{doc.docType}</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}
                      >
                        {STATUS_LABELS[doc.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-midnight/50">
                      Sent {formatDate(doc.submittedAt)}
                      {doc.expiresAt ? ` · expires ${formatDate(doc.expiresAt)}` : ""}
                    </p>
                    {doc.reviewReason && (
                      <p className="mt-1 text-xs text-amber">{doc.reviewReason}</p>
                    )}
                  </div>
                  {doc.signedUrl && (
                    <a
                      href={doc.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-gold-dark hover:text-gold"
                    >
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {missing.length > 0 && (
            <p className="mt-3 text-xs text-midnight/60">
              Still needed: <strong className="text-midnight">{missing.join(", ")}</strong>
            </p>
          )}

          <UploadRow
            vehicleId={vehicleId}
            vehicleLabel={vehicleLabel}
            // Missing types first, so the obvious next action is preselected.
            types={[...missing, ...expectedTypes.filter((t) => !missing.includes(t))]}
          />
        </div>
      )}
    </div>
  );
}

function UploadRow({
  vehicleId,
  vehicleLabel,
  types,
}: {
  vehicleId: string;
  vehicleLabel: string;
  types: string[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(types[0] ?? "");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !docType) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`That file is too large. Maximum size is ${MAX_UPLOAD_LABEL}.`);
      return;
    }

    setBusy(true);
    setError(null);
    setDone(false);

    // Through the route, not straight to storage: it strips EXIF from a photo
    // of a logbook and checks the bytes are really an image or a PDF.
    const form = new FormData();
    form.set("file", file);
    form.set("vehicleId", vehicleId);
    form.set("docType", docType);

    let path: string;
    try {
      const response = await fetch("/api/vehicle-document", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) {
        setBusy(false);
        setError(result.error ?? "That upload didn't work. Try again.");
        return;
      }
      path = result.path;
    } catch {
      setBusy(false);
      setError("Upload failed. Check your connection and try again.");
      return;
    }

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setBusy(false);
      setError("Your session has expired. Sign in again.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("vehicle_documents")
      .insert({
        vehicle_id: vehicleId,
        doc_type: docType,
        file_path: path,
        expires_at: expiry || null,
        uploaded_by: userData.user.id,
      })
      .select("id");

    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    // The file is in the bucket but the row is not there, so nothing would
    // ever show it to a reviewer. Worth saying rather than looking successful.
    if (!data || data.length === 0) {
      setError("The file uploaded but wasn't recorded. Try again, or contact us.");
      return;
    }

    setDone(true);
    setExpiry("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  if (types.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-line">
      <p className="text-xs font-semibold text-midnight">Upload a document</p>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-midnight/60">Type</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            aria-label={`Document type for ${vehicleLabel}`}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-midnight/60">
            Expiry date <span className="font-normal text-midnight/40">(if it has one)</span>
          </span>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            aria-label={`Expiry date for ${vehicleLabel}`}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        aria-label={`Document file for ${vehicleLabel}`}
        className="mt-2 block w-full text-xs text-midnight/70 file:mr-3 file:rounded-md file:border-0 file:bg-midnight/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-midnight"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !docType}
          onClick={upload}
          className="rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        <span className="text-xs text-midnight/40">
          JPG, PNG or PDF, up to {MAX_UPLOAD_LABEL}
        </span>
      </div>

      {done && (
        <p role="status" className="mt-2 text-xs text-emerald-dark">
          Sent. We&apos;ll review it and let you know.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
