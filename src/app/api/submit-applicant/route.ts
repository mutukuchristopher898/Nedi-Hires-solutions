import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateApplicantPayload, type ApplicantValidationInput } from "@/lib/documentValidation/validateApplicant";

interface SubmitApplicantBody extends ApplicantValidationInput {
  bookingId: string;
  dateOfBirth: string | null;
  licenseIssueDate: string | null;
  idFilePath: string;
  licenseFilePath: string | null;
  passportPhotoFilePath: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitApplicantBody;

  if (!body.bookingId || !body.idFilePath || !body.passportPhotoFilePath) {
    return NextResponse.json({ error: "bookingId and the required document uploads are missing." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
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
      { error: "Self-drive bookings require your date of birth and driving licence issue date." },
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
  const { data: overlap } = await supabase.rpc("find_overlapping_active_booking", {
    p_id_number_normalized: result.normalized.idNumberNormalized,
    p_start: booking.start_date,
    p_end: booking.end_date,
    p_exclude_booking_id: body.bookingId,
  });
  if (overlap && overlap.length > 0) {
    return NextResponse.json(
      {
        error: `You already have a reservation for these dates (ref: ${overlap[0].booking_ref}). View it in your account.`,
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
  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 400 });
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
    return NextResponse.json({ error: applicantError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
