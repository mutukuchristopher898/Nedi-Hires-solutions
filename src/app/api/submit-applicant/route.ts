import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApplicantPayload, type ApplicantValidationInput } from "@/lib/documentValidation/validateApplicant";
import { enforceApiRateLimit, readJsonObject, rejectCrossSite } from "@/lib/apiSecurity";
import { isOwnBookingStoragePath } from "@/lib/uploads";

interface SubmitApplicantBody extends ApplicantValidationInput {
  bookingId: string;
  dateOfBirth: string | null;
  licenseIssueDate: string | null;
  idFilePath: string;
  licenseFilePath: string | null;
  passportPhotoFilePath: string;
}

// Fields that must be strings when present. The body is cast to
// SubmitApplicantBody below, and a cast is a promise to the compiler, not a
// check — a number or an object arriving in one of these would otherwise
// reach .trim() and throw.
const STRING_FIELDS = [
  "bookingId", "idFilePath", "passportPhotoFilePath", "licenseFilePath", "dateOfBirth",
  "licenseIssueDate", "idType", "idNumber", "nationality", "licenseNumber", "address",
  "guarantorName", "guarantorPhone", "guarantorRelationship",
] as const;

export async function POST(request: Request) {
  const crossSite = rejectCrossSite(request);
  if (crossSite) return crossSite;

  const parsed = await readJsonObject(request);
  if ("error" in parsed) return parsed.error;

  for (const field of STRING_FIELDS) {
    const value = parsed.body[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }
  }

  const body = parsed.body as unknown as SubmitApplicantBody;

  if (!body.bookingId || !body.idFilePath || !body.passportPhotoFilePath) {
    return NextResponse.json({ error: "bookingId and the required document uploads are missing." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const limited = await enforceApiRateLimit(supabase, "applicant_submit");
  if (limited) return limited;

  // Every file path is something the browser told us. Each one has to be a
  // file this customer uploaded for this booking. Without the check, a
  // booking's document record could point at any path at all — including
  // another customer's ID scan, which a reviewer would then see presented as
  // this applicant's. Storage RLS stops the customer reading it; it does not
  // stop the record being written.
  const userId = userData.user.id;
  const paths = [body.idFilePath, body.passportPhotoFilePath, body.licenseFilePath].filter(
    (path): path is string => typeof path === "string" && path.length > 0,
  );
  if (!paths.every((path) => isOwnBookingStoragePath(path, userId, body.bookingId))) {
    return NextResponse.json({ error: "One of the uploaded files does not belong to this booking." }, { status: 400 });
  }

  // RLS scopes this to bookings the caller owns — an empty result means
  // either it doesn't exist or isn't theirs, either way treated as not found.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, drive_type")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Self-drive eligibility depends on two dates that validateApplicantPayload
  // never sees, because they're collected in the trip step rather than this
  // form. Requiring them here is the TypeScript half of the fix; the
  // check_driver_eligibility trigger enforces the actual age and experience
  // thresholds. Previously a POST omitting dateOfBirth passed both layers,
  // because a NULL date made the trigger's age comparison NULL, which
  // PL/pgSQL treats as false.
  if (booking.drive_type === "self_drive" && (!body.dateOfBirth || !body.licenseIssueDate)) {
    return NextResponse.json(
      { error: "Self drive bookings require your date of birth and driving licence issue date." },
      { status: 400 }
    );
  }

  // spec §0.1 — the server is the only authority. Re-run the exact same
  // validation the client already ran; a direct POST with garbage data must
  // be rejected here regardless of what the UI showed.
  const result = validateApplicantPayload(body);
  if (!result.valid || !result.normalized) {
    return NextResponse.json({ fieldErrors: result.fieldErrors, warnings: result.warnings }, { status: 400 });
  }

  // spec §5.2 — reject if this same person (identified by document number)
  // already has another active booking with overlapping dates.
  //
  // The lookup needs the server-only writer secret (migration 20261011090000),
  // so it cannot be used from a browser as an oracle for "has this national
  // ID number booked, and when". The booking reference only comes back when
  // the clashing booking belongs to the caller; a clash with someone else's
  // booking gets the same refusal without naming it.
  const { data: overlap, error: overlapError } = await supabase.rpc("find_overlapping_active_booking", {
    p_id_number_normalized: result.normalized.idNumberNormalized,
    p_start: booking.start_date,
    p_end: booking.end_date,
    p_exclude_booking_id: body.bookingId,
    p_writer_secret: process.env.VERIFICATION_WRITER_SECRET ?? "",
  });
  if (overlapError) {
    return NextResponse.json({ error: "We couldn't check your details just now. Please try again." }, { status: 503 });
  }
  if (overlap && overlap.length > 0) {
    const ownRef = overlap[0].booking_ref as string | null;
    return NextResponse.json(
      {
        error: ownRef
          ? `You already have a reservation for these dates (ref: ${ownRef}). View it in your account.`
          : "This ID document is already on an active reservation for these dates. Contact us if you think this is a mistake.",
      },
      { status: 409 }
    );
  }

  const documentRows: { booking_id: string; customer_id: string; doc_type: string; file_url: string; status: string }[] = [
    { booking_id: body.bookingId, customer_id: userData.user.id, doc_type: body.idType, file_url: body.idFilePath, status: "pending" },
    {
      booking_id: body.bookingId,
      customer_id: userData.user.id,
      doc_type: "Passport Photo",
      file_url: body.passportPhotoFilePath,
      status: "pending",
    },
  ];
  if (body.licenseFilePath) {
    documentRows.push({
      booking_id: body.bookingId,
      customer_id: userData.user.id,
      doc_type: "Driver's License",
      file_url: body.licenseFilePath,
      status: "pending",
    });
  }

  const { error: docsError } = await supabase.from("identity_documents").insert(documentRows);
  // Raw database errors name tables, columns and constraints — a map of the
  // schema for whoever is probing. Logged for us, generic for them.
  if (docsError) {
    console.error("submit-applicant: identity_documents insert failed", docsError.code, docsError.message);
    return NextResponse.json({ error: "We couldn't save your documents. Please try again." }, { status: 400 });
  }

  const { error: applicantError } = await supabase.from("booking_applicants").insert({
    booking_id: body.bookingId,
    customer_id: userData.user.id,
    date_of_birth: body.dateOfBirth || null,
    nationality: body.nationality,
    surname: result.normalized.surname,
    given_names: result.normalized.givenNames,
    middle_name: result.normalized.middleName || null,
    mononym_declared: body.mononymDeclared,
    full_name: result.normalized.fullName,
    id_type: body.idType,
    id_number: body.idNumber.trim(),
    id_number_normalized: result.normalized.idNumberNormalized,
    license_number: body.licenseNumber || null,
    license_issue_date: body.licenseIssueDate || null,
    address: body.address.trim(),
    phone_number: result.normalized.phoneE164,
    guarantor_name: body.guarantorName.trim(),
    guarantor_phone: result.normalized.guarantorPhoneE164,
    guarantor_relationship: body.guarantorRelationship.trim(),
  });

  if (applicantError) {
    console.error("submit-applicant: booking_applicants insert failed", applicantError.code, applicantError.message);
    // Eligibility and rate limits raise their own customer-facing messages
    // from the database; those are written for customers and pass through.
    const customerFacing = applicantError.code === "54000" || applicantError.code === "P0001";
    return NextResponse.json(
      { error: customerFacing ? applicantError.message : "We couldn't save your details. Please check them and try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
