import { createClient } from "./client";

const BUCKET = "kyc-documents";

// Uploads a KYC file (ID/passport, driver's license, passport photo) into a
// path scoped to the uploading user, matching the storage.objects RLS
// policies (per-user folder prefix, admin-select-all). Returns the storage
// path to store on the corresponding identity_documents row.
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
  const supabase = createClient();
  const extension = file.name.split(".").pop() || "bin";
  const path = `${userId}/${bookingId}/${docSlug}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });

  if (error) throw error;
  return path;
}
