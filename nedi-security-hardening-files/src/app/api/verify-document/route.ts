import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwnBookingStoragePath } from "@/lib/uploads";
import { enforceApiRateLimit, readJsonObject, rejectCrossSite } from "@/lib/apiSecurity";
import { verifyDocument } from "@/lib/smileIdentity";

export async function POST(request: Request) {
  const crossSite = rejectCrossSite(request);
  if (crossSite) return crossSite;

  const parsed = await readJsonObject(request);
  if ("error" in parsed) return parsed.error;
  const { bookingId, storagePath } = parsed.body;

  if (typeof bookingId !== "string" || typeof storagePath !== "string" || !bookingId || !storagePath) {
    return NextResponse.json({ error: "bookingId and storagePath are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Each call here can be a paid request to the identity provider. Metered
  // per account so a script cannot run up the bill or use us to hammer them.
  const limited = await enforceApiRateLimit(supabase, "identity_verification");
  if (limited) return limited;

  // RLS scopes this to bookings the caller owns — an empty result means
  // either it doesn't exist or isn't theirs, either way treated as not found.
  const { data: booking } = await supabase.from("bookings").select("id").eq("id", bookingId).maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!isOwnBookingStoragePath(storagePath, userData.user.id, bookingId)) {
    return NextResponse.json({ error: "That file does not belong to this booking." }, { status: 400 });
  }

  const { data: applicant } = await supabase
    .from("booking_applicants")
    .select("id_type, id_number, full_name")
    .eq("booking_id", bookingId)
    .single();

  if (!applicant) {
    return NextResponse.json({ error: "Applicant details not found for this booking" }, { status: 404 });
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage.from("kyc-documents").download(storagePath);
  if (downloadError || !fileBlob) {
    return NextResponse.json({ error: "Could not read the uploaded document" }, { status: 400 });
  }

  const imageBytes = new Uint8Array(await fileBlob.arrayBuffer());

  const docResult = await verifyDocument({
    imageBytes,
    idType: applicant.id_type,
    idNumber: applicant.id_number,
    fullName: applicant.full_name,
  });

  // "unconfigured" (no Smile Identity credentials yet) maps to the DB's
  // "pending" status — the constraint only allows pending/verified/needs_review/failed.
  let status: "pending" | "verified" | "needs_review" | "failed" =
    docResult.outcome === "unconfigured" ? "pending" : docResult.outcome;
  let notes = docResult.notes;

  if (status === "verified" || status === "needs_review") {
    const { data: isDuplicate, error: duplicateError } = await supabase.rpc("find_duplicate_id_number", {
      p_id_number: applicant.id_number,
      p_exclude_customer_id: userData.user.id,
      // Gated so the lookup is not a browser-callable "is this ID on file?"
      // oracle. See migration 20261011090000.
      p_writer_secret: process.env.VERIFICATION_WRITER_SECRET ?? "",
    });

    if (isDuplicate) {
      status = "needs_review";
      notes = `${notes} This ID number is already on file under a different account.`;
    } else if (duplicateError) {
      // Fail safe: if the duplicate check could not run, a person reviews it
      // rather than it passing as if the check had come back clean.
      console.error("verify-document: duplicate check failed", duplicateError.code, duplicateError.message);
      status = "needs_review";
      notes = `${notes} The duplicate-ID check could not run; review manually.`;
    }
  }

  // Written through a capability-gated RPC rather than a direct update.
  // This route authenticates with the anon key plus the customer's own JWT,
  // so it executes AS the customer — meaning a direct PATCH from the browser
  // was indistinguishable from this write and customers could mark their own
  // KYC 'verified'. The RPC requires a server-only secret the browser has no
  // access to. Not a service_role key: it grants this one power and nothing else.
  const { error: applyError } = await supabase.rpc("apply_verification_result", {
    p_booking_id: bookingId,
    p_status: status,
    p_notes: notes,
    p_writer_secret: process.env.VERIFICATION_WRITER_SECRET ?? "",
  });

  if (applyError) {
    return NextResponse.json({ error: "Could not record the verification result." }, { status: 500 });
  }

  return NextResponse.json({ status, notes });
}
