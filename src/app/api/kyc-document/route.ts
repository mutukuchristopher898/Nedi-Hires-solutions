import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";

// Identity documents go through here for the same reason vehicle photos do: a
// photograph of an ID taken on a phone carries EXIF, and EXIF carries GPS —
// in this case the home address of someone who has also just handed over
// their ID number. The bucket is private, which lowers the blast radius but
// does not make keeping the coordinates a good idea.
//
// It also replaces a client-side type check that was only ever a courtesy.
// file.type is supplied by the browser; this parses the actual bytes.

const ALLOWED_IMAGE_FORMATS = ["jpeg", "png", "webp"] as const;

// Identity documents are read by a human reviewer and by the verification
// pipeline, so resolution matters more than for a listing photo.
const MAX_DIMENSION = 3000;

const PDF_MAGIC = Buffer.from("%PDF-");

// Mirrors uploadKycFile's shape. isOwnBookingStoragePath in the verification
// routes asserts this prefix, so it is load-bearing, not cosmetic.
function storagePath(userId: string, bookingId: string, docSlug: string, extension: string) {
  return `${userId}/${bookingId}/${docSlug}-${Date.now()}.${extension}`;
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
  const bookingId = form.get("bookingId");
  const docSlug = form.get("docSlug");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (typeof bookingId !== "string" || typeof docSlug !== "string") {
    return NextResponse.json({ error: "Missing booking details." }, { status: 400 });
  }
  // Goes into a storage path, so it may only ever be one of ours.
  if (!["id", "license", "passport-photo", "selfie"].includes(docSlug)) {
    return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
  }

  // RLS scopes this to bookings the caller owns, so an empty result means
  // either it does not exist or it is not theirs — treated the same, so the
  // response cannot be used to discover which.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `This file is too large. Maximum size is ${MAX_UPLOAD_LABEL}.` },
      { status: 413 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // A PDF cannot be re-encoded by sharp, so it is identified by its magic
  // bytes and stored as-is. Worth recording the residual risk: a PDF can
  // carry script, and an admin opens these. They are served from a private
  // bucket over a short-lived signed URL, never rendered inside our origin.
  if (input.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    const path = storagePath(userData.user.id, bookingId, docSlug, "pdf");
    const { error } = await supabase.storage
      .from("kyc-documents")
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
      // JPEG rather than WebP: these get posted on to the identity
      // verification provider, and JPEG is the format every such API accepts.
      // Quality kept high because a reviewer has to read an ID number off it.
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "This file couldn't be read. Try a different image." },
      { status: 400 }
    );
  }

  const path = storagePath(userData.user.id, bookingId, docSlug, "jpg");

  // Uploaded as the caller, so the bucket's per-user folder policy still
  // applies. This route holds no elevated key.
  const { error: uploadError } = await supabase.storage
    .from("kyc-documents")
    .upload(path, output, { contentType: "image/jpeg" });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed. Check your connection and try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ path });
}
