import { createClient } from "./client";
import {
  MAX_VEHICLE_PHOTO_LABEL,
  VEHICLE_PHOTO_EXTENSION_BY_TYPE,
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
  userId,
  file,
}: {
  userId: string;
  file: File;
}): Promise<string> {
  if (!isAllowedVehiclePhoto(file)) {
    throw new Error("Photos must be JPG, PNG or WebP.");
  }
  if (!isVehiclePhotoWithinLimit(file)) {
    throw new Error(`Each photo must be ${MAX_VEHICLE_PHOTO_LABEL} or smaller.`);
  }

  const supabase = createClient();

  // From the validated type, never from file.name — see uploadKycFile.
  const extension = VEHICLE_PHOTO_EXTENSION_BY_TYPE[file.type];
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${unique}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });

  if (error) throw error;
  return path;
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
