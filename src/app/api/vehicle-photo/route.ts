import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { MAX_VEHICLE_PHOTO_BYTES, MAX_VEHICLE_PHOTO_LABEL } from "@/lib/uploads";

// Vehicle photographs are uploaded through here rather than straight from the
// browser to storage, for one reason that cannot be done any other way: a
// phone photograph carries EXIF, and EXIF carries GPS. The vehicle-photos
// bucket is public, so a partner uploading a picture taken on their driveway
// was publishing their home address to anyone who downloaded it.
//
// Stripping EXIF in the browser is not a fix — anyone can post to storage
// directly with their own token. Re-encoding on the server is.
//
// It also gives us a real format check. The browser's file.type is a claim,
// not evidence; sharp has to actually parse the bytes, so a file that only
// says it is a JPEG does not get through.

const ALLOWED_FORMATS = ["jpeg", "png", "webp"] as const;

// Large enough for a detail page on a high-density screen, small enough that
// a listing page is not moving tens of megabytes.
const MAX_DIMENSION = 2000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Checked before reading the body into memory, so an oversized upload is
  // refused rather than buffered.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_VEHICLE_PHOTO_BYTES) {
    return NextResponse.json(
      { error: `This file is too large. Maximum size is ${MAX_VEHICLE_PHOTO_LABEL}.` },
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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  // Again after reading: content-length is a header, and headers are a claim.
  if (file.size > MAX_VEHICLE_PHOTO_BYTES) {
    return NextResponse.json(
      { error: `This file is too large. Maximum size is ${MAX_VEHICLE_PHOTO_LABEL}.` },
      { status: 413 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  try {
    // Reads the real container, not the filename or the declared type.
    ({ format } = await sharp(input).metadata());
  } catch {
    return NextResponse.json(
      { error: "This file couldn't be read. Try a different image." },
      { status: 400 }
    );
  }

  if (!format || !(ALLOWED_FORMATS as readonly string[]).includes(format)) {
    // Notably excludes SVG, which sharp can read but which is an XML document
    // that can carry script.
    return NextResponse.json(
      { error: "Only JPG, PNG, and WebP images are accepted." },
      { status: 415 }
    );
  }

  let output: Buffer;
  try {
    output = await sharp(input)
      // Applies the EXIF orientation before it is discarded, so a photo taken
      // sideways does not end up sideways.
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      // Re-encoding is what actually removes EXIF and anything else riding
      // along in the original container.
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "This file couldn't be read. Try a different image." },
      { status: 400 }
    );
  }

  // Random name, never anything the client supplied — a user-controlled
  // filename in a path is how directory traversal starts.
  const path = `${userData.user.id}/${crypto.randomUUID()}.webp`;

  // Uploaded as the caller, so the bucket's own policy still applies: the
  // first path segment must equal auth.uid(). This route holds no elevated
  // key and cannot write outside the caller's own folder.
  const { error: uploadError } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, output, { contentType: "image/webp" });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed. Check your connection and try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ path });
}
