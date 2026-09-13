import {
  MAX_VEHICLE_PHOTO_LABEL,
  isAllowedVehiclePhoto,
  isVehiclePhotoWithinLimit,
} from "@/lib/uploads";

const BUCKET = "vehicle-photos";

// Uploads one listing photograph and returns its storage path, which is what
// gets stored in vehicles.photo_paths.
//
// The path starts with the uploader's id to match the bucket's insert policy
// (first folder segment must equal auth.uid()). Unlike kyc-documents this
// bucket is public, so the stored path resolves to a permanent public URL —
// see publicVehiclePhotoUrl below.
export async function uploadVehiclePhoto({
  file,
}: {
  file: File;
}): Promise<string> {
  // Client-side checks are for a fast, clear error — the route re-checks all
  // of this, and the route is what actually decides.
  if (!isAllowedVehiclePhoto(file)) {
    throw new Error("Photos must be JPG, PNG or WebP.");
  }
  if (!isVehiclePhotoWithinLimit(file)) {
    throw new Error(`Each photo must be ${MAX_VEHICLE_PHOTO_LABEL} or smaller.`);
  }

  // Routed through the server rather than posted straight to storage, so the
  // image can be re-encoded: that is the only place EXIF — and the GPS
  // coordinates in it — can actually be stripped before a public bucket
  // serves the file. See src/app/api/vehicle-photo/route.ts.
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/vehicle-photo", { method: "POST", body });
  const result = (await response.json().catch(() => ({}))) as { path?: string; error?: string };

  if (!response.ok || !result.path) {
    throw new Error(result.error ?? "Upload failed. Check your connection and try again.");
  }

  return result.path;
}

/**
 * Resolves a stored photo_paths entry to a URL an <img> can load.
 *
 * Built as a string rather than via supabase.storage.getPublicUrl() so it can
 * be called from server components too — listing pages render on the server,
 * and importing the browser client there would be wrong. This is the
 * documented public-object URL shape for a public bucket.
 */
export function publicVehiclePhotoUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
