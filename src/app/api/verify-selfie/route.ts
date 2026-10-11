import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwnBookingStoragePath } from "@/lib/uploads";
import { enforceApiRateLimit, readJsonObject, rejectCrossSite } from "@/lib/apiSecurity";
import { verifySelfie } from "@/lib/smileIdentity";
import { SELFIE_VERIFICATION_ENABLED } from "@/lib/features";

export async function POST(request: Request) {
  // Switched off in src/lib/features.ts. Refused outright rather than left
  // callable: a feature nobody can see should not be an endpoint anyone can
  // use (it calls a paid identity service).
  if (!SELFIE_VERIFICATION_ENABLED) {
    return NextResponse.json({ error: "Selfie verification is not currently in use." }, { status: 404 });
  }

  const crossSite = rejectCrossSite(request);
  if (crossSite) return crossSite;

  const parsed = await readJsonObject(request);
  if ("error" in parsed) return parsed.error;
  const { bookingId, selfieStoragePath } = parsed.body;

  if (typeof bookingId !== "string" || typeof selfieStoragePath !== "string" || !bookingId || !selfieStoragePath) {
    return NextResponse.json({ error: "bookingId and selfieStoragePath are required" }, { status: 400 });
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

  const { data: booking } = await supabase.from("bookings").select("id").eq("id", bookingId).maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!isOwnBookingStoragePath(selfieStoragePath, userData.user.id, bookingId)) {
    return NextResponse.json({ error: "That file does not belong to this booking." }, { status: 400 });
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

  // The ID document path came from the database, but it was originally
  // written from browser input, so it gets the same ownership check as the
  // selfie path rather than being trusted because of where it was read from.
  if (idDoc && !isOwnBookingStoragePath(idDoc.file_url, userData.user.id, bookingId)) {
    return NextResponse.json({ error: "Could not read the selfie or ID document" }, { status: 400 });
  }

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

  // See the note in verify-document/route.ts: this write goes through a
  // capability-gated RPC because this route holds the customer's own
  // credential and cannot otherwise be distinguished from the browser.
  const { error: applyError } = await supabase.rpc("apply_verification_result", {
    p_booking_id: bookingId,
    p_status: status,
    p_notes: matchResult.notes,
    p_writer_secret: process.env.VERIFICATION_WRITER_SECRET ?? "",
  });

  if (applyError) {
    return NextResponse.json({ error: "Could not record the verification result." }, { status: 500 });
  }

  return NextResponse.json({ status, notes: matchResult.notes });
}
