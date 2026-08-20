import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySelfie } from "@/lib/smileIdentity";

export async function POST(request: Request) {
  const { bookingId, selfieStoragePath } = await request.json();

  if (!bookingId || !selfieStoragePath) {
    return NextResponse.json({ error: "bookingId and selfieStoragePath are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: booking } = await supabase.from("bookings").select("id").eq("id", bookingId).maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { data: applicant } = await supabase
    .from("booking_applicants")
    .select("id_type, verification_status")
    .eq("booking_id", bookingId)
    .single();

  if (!applicant) {
    return NextResponse.json({ error: "Applicant details not found for this booking" }, { status: 404 });
  }

  const { data: idDoc } = await supabase
    .from("identity_documents")
    .select("file_url")
    .eq("booking_id", bookingId)
    .eq("doc_type", applicant.id_type)
    .single();

  const [selfieDownload, docDownload] = await Promise.all([
    supabase.storage.from("kyc-documents").download(selfieStoragePath),
    idDoc ? supabase.storage.from("kyc-documents").download(idDoc.file_url) : Promise.resolve({ data: null, error: null }),
  ]);

  if (!selfieDownload.data || !docDownload.data) {
    return NextResponse.json({ error: "Could not read the selfie or ID document" }, { status: 400 });
  }

  const selfieBytes = new Uint8Array(await selfieDownload.data.arrayBuffer());
  const documentImageBytes = new Uint8Array(await docDownload.data.arrayBuffer());

  const matchResult = await verifySelfie({ selfieBytes, documentImageBytes });

  // A prior hard "failed" (e.g. the document itself wasn't valid) is never
  // overwritten by the selfie step — that call already ended the process.
  if (applicant.verification_status === "failed") {
    return NextResponse.json({ status: "failed", notes: "Document verification already failed." });
  }

  const status: "pending" | "verified" | "needs_review" =
    matchResult.outcome === "unconfigured" ? "pending" : matchResult.outcome === "failed" ? "needs_review" : matchResult.outcome;

  await supabase
    .from("booking_applicants")
    .update({ verification_status: status, verification_notes: matchResult.notes })
    .eq("booking_id", bookingId);

  return NextResponse.json({ status, notes: matchResult.notes });
}
