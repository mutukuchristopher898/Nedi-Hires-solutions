import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";

// Vehicle paperwork — logbook, insurance certificate, inspection — goes
// through here rather than straight to storage, for the same reasons the KYC
// route exists:
//
//   * A photograph of a logbook taken on a phone carries EXIF, and EXIF
//     carries GPS. That is the location of a vehicle alongside proof of who
//     owns it. Re-encoding through sharp drops it.
//   * file.type is supplied by the browser and is a courtesy, not a check.
//     This parses the actual bytes.
//
// The bucket is private and these are only ever served over short-lived
// signed URLs.

const ALLOWED_IMAGE_FORMATS = ["jpeg", "png", "webp"] as const;

// A reviewer has to read a policy number and an expiry date off these, so
// resolution is kept high — same reasoning as identity documents.
const MAX_DIMENSION = 3000;

const PDF_MAGIC = Buffer.from("%PDF-");

// Matches the bucket policy, which asserts the first folder is the uploader's
// own id. Load-bearing, not cosmetic.
function storagePath(userId: string, vehicleId: string, docSlug: string, extension: string) {
  return `${userId}/${vehicleId}/${docSlug}-${Date.now()}.${extension}`;
}

// The document type is operator-editable, so it cannot be validated against a
// fixed list. It still ends up in a storage path, so it is reduced to
// characters that cannot escape one — no dots, no slashes, no traversal.
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `This file is too large. Maximum size is ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "That upload couldn't be read." }, { status: 400 });
  }

  const file = form.get("file");
  const vehicleId = form.get("vehicleId");
  const docType = form.get("docType");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (typeof vehicleId !== "string" || typeof docType !== "string") {
    return NextResponse.json({ error: "Missing vehicle details." }, { status: 400 });
  }

  const docSlug = slugify(docType);
  if (!docSlug) {
    return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
  }

  // RLS scopes this to vehicles the caller's partner account owns, so an empty
  // result means either it does not exist or it is not theirs. Treated the
  // same, so the response cannot be used to discover which.
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .maybeSingle();

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `This file is too large. Maximum size is ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Most of these arrive as PDFs — a logbook scan or an insurer's emailed
  // certificate — so this is the common path, not the exception. sharp cannot
  // re-encode a PDF, so it is identified by its magic bytes and stored as-is.
  // Residual risk worth recording: a PDF can carry script, and staff open
  // these. They come from a private bucket over a signed URL and are never
  // rendered inside our origin.
  if (input.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    const path = storagePath(userData.user.id, vehicleId, docSlug, "pdf");
    const { error } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, input, { contentType: "application/pdf" });

    if (error) {
      return NextResponse.json(
        { error: "Upload failed. Check your connection and try again." },
        { status: 502 }
      );
    }
    return NextResponse.json({ path });
  }

  let format: string | undefined;
  try {
    ({ format } = await sharp(input).metadata());
  } catch {
    return NextResponse.json(
      { error: "This file couldn't be read. Try a different image." },
      { status: 400 }
    );
  }

  if (!format || !(ALLOWED_IMAGE_FORMATS as readonly string[]).includes(format)) {
    return NextResponse.json(
      { error: "Only image (JPG/PNG/WebP) or PDF files are accepted." },
      { status: 415 }
    );
  }

  let output: Buffer;
  try {
    output = await sharp(input)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "This file couldn't be read. Try a different image." },
      { status: 400 }
    );
  }

  const path = storagePath(userData.user.id, vehicleId, docSlug, "jpg");

  // Uploaded as the caller, so the bucket's per-user folder policy still
  // applies. This route holds no elevated key.
  const { error: uploadError } = await supabase.storage
    .from("vehicle-documents")
    .upload(path, output, { contentType: "image/jpeg" });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed. Check your connection and try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ path });
}
