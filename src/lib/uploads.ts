// One definition of what may be uploaded, shared by the browser forms and the
// storage helper.
//
// These values mirror the kyc-documents bucket's own file_size_limit and
// allowed_mime_types, set in 20260911090000. The bucket is the enforcement
// point — file.type is supplied by the browser and trivially spoofed, so
// everything here is for giving people a decent error before they wait on an
// upload that the server would reject. Keep the two in sync.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Keyed by MIME type so the stored filename's extension can be derived from
// the type we accepted rather than from the name the user's device supplied.
export const UPLOAD_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const ALLOWED_UPLOAD_TYPES = Object.keys(UPLOAD_EXTENSION_BY_TYPE);

export function isAllowedUpload(file: File): boolean {
  return ALLOWED_UPLOAD_TYPES.includes(file.type);
}

export function isWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_UPLOAD_BYTES;
}

/** Human-readable cap, for error copy. */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`;

/**
 * Storage paths are minted by `uploadKycFile` as `<userId>/<bookingId>/...`.
 * The verification routes receive one from the browser, so they re-derive that
 * expectation instead of trusting what they were handed.
 *
 * The bucket's RLS already stops the serious version of this — both the insert
 * and select policies require the first path segment to equal auth.uid(), and
 * the routes run as the caller, so another customer's document was never
 * reachable. What this closes is the remaining case: pointing a booking's
 * verification at a document the same user uploaded for a *different* booking.
 * It also means a future loosening of the storage policy doesn't silently turn
 * into a cross-account read here.
 */
export function isOwnBookingStoragePath(
  path: unknown,
  userId: string,
  bookingId: string,
): path is string {
  return (
    typeof path === "string" &&
    !path.includes("..") &&
    path.startsWith(`${userId}/${bookingId}/`)
  );
}

// ── Vehicle listing photographs ──────────────────────────────
// Separate limits from the KYC documents above: these are marketing images,
// so no PDFs, and a tighter cap because they are served to every visitor
// browsing search. Mirrors the vehicle-photos bucket in 20260912090000.

export const MAX_VEHICLE_PHOTO_BYTES = 5 * 1024 * 1024;

export const VEHICLE_PHOTO_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_VEHICLE_PHOTO_TYPES = Object.keys(VEHICLE_PHOTO_EXTENSION_BY_TYPE);

export const MAX_VEHICLE_PHOTO_LABEL = `${MAX_VEHICLE_PHOTO_BYTES / (1024 * 1024)}MB`;

export function isAllowedVehiclePhoto(file: File): boolean {
  return ALLOWED_VEHICLE_PHOTO_TYPES.includes(file.type);
}

export function isVehiclePhotoWithinLimit(file: File): boolean {
  return file.size <= MAX_VEHICLE_PHOTO_BYTES;
}
