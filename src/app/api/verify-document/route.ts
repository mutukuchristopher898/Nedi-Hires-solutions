import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyDocument } from "@/lib/smileIdentity";

export async function POST(request: Request) {
  const { bookingId, storagePath } = await request.json();

  if (!bookingId || !storagePath) {
    return NextResponse.json({ error: "bookingId and storagePath are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // RLS scopes this to bookings the caller owns — an empty result means
  // either it doesn't exist or isn't theirs, either way treated as not found.
  const { data: booking } = await supabase.from("bookings").select("id").eq("id", bookingId).maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
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
    const { data: isDuplicate } = await supabase.rpc("find_duplicate_id_number", {
      p_id_number: applicant.id_number,
      p_exclude_customer_id: userData.user.id,
    });

    if (isDuplicate) {
      status = "needs_review";
      notes = `${notes} This ID number is already on file under a different account.`;
    }
  }

  await supabase.from("booking_applicants").update({ verification_status: status, verification_notes: notes }).eq("booking_id", bookingId);

  return NextResponse.json({ status, notes });
}
