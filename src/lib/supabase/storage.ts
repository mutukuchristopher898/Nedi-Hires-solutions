import { createClient } from "./client";
import {
  MAX_UPLOAD_LABEL,
  UPLOAD_EXTENSION_BY_TYPE,
  isAllowedUpload,
  isWithinSizeLimit,
} from "@/lib/uploads";

const BUCKET = "kyc-documents";

// Uploads a KYC file (ID/passport, driver's license, passport photo) into a
// path scoped to the uploading user, matching the storage.objects RLS
// policies (per-user folder prefix, admin-select-all). Returns the storage
// path to store on the corresponding identity_documents row.
//
// The path shape `<userId>/<bookingId>/<slug>-<ts>.<ext>` is load-bearing in
// two places beyond the RLS prefix check: the verification routes assert the
// path they are handed sits under the caller's own id and this booking. Don't
// reshape it without updating those.
export async function uploadKycFile({
  userId,
  bookingId,
  docSlug,
  file,
}: {
  userId: string;
  bookingId: string;
  docSlug: string;
  file: File;
}): Promise<string> {
  // The bucket enforces both of these too. Checking here turns a rejected
  // upload into a clear message instead of a failed round-trip.
  if (!isAllowedUpload(file)) {
    throw new Error("Only JPG, PNG, WebP or PDF files can be uploaded.");
  }
  if (!isWithinSizeLimit(file)) {
    throw new Error(`Each file must be ${MAX_UPLOAD_LABEL} or smaller.`);
  }

  const supabase = createClient();

  // Derived from the type we just validated, never from file.name — a device
  // can hand over any filename it likes, and this string ends up as the
  // stored object's extension.
  const extension = UPLOAD_EXTENSION_BY_TYPE[file.type];
  const path = `${userId}/${bookingId}/${docSlug}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });

  if (error) throw error;
  return path;
}
