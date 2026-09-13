import {
  MAX_UPLOAD_LABEL,
  isAllowedUpload,
  isWithinSizeLimit,
} from "@/lib/uploads";

// Uploads a KYC file (ID/passport, driver's license, passport photo) via the
// server, which re-encodes images to strip EXIF — a photograph of an ID taken
// on a phone carries the GPS coordinates of wherever it was taken, typically
// the home of the person who has just also handed over their ID number.
//
// Posting straight to storage from the browser cannot strip anything, so the
// round-trip is the point rather than an inconvenience.
//
// Returns the storage path to record on the identity_documents row. The shape
// `<userId>/<bookingId>/<slug>-<ts>.<ext>` is decided server-side and asserted
// again by the verification routes.
export async function uploadKycFile({
  bookingId,
  docSlug,
  file,
}: {
  bookingId: string;
  docSlug: string;
  file: File;
}): Promise<string> {
  // Client-side checks are for a fast, clear error. The route re-checks all of
  // it against the actual bytes, and the route is what decides.
  if (!isAllowedUpload(file)) {
    throw new Error("Only JPG, PNG, WebP or PDF files can be uploaded.");
  }
  if (!isWithinSizeLimit(file)) {
    throw new Error(`Each file must be ${MAX_UPLOAD_LABEL} or smaller.`);
  }

  const body = new FormData();
  body.append("file", file);
  body.append("bookingId", bookingId);
  body.append("docSlug", docSlug);

  const response = await fetch("/api/kyc-document", { method: "POST", body });
  const result = (await response.json().catch(() => ({}))) as { path?: string; error?: string };

  if (!response.ok || !result.path) {
    throw new Error(result.error ?? "Upload failed. Check your connection and try again.");
  }

  return result.path;
}
