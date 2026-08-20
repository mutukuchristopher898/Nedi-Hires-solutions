import { getCountryRule, isValidIso2, normalizeDocumentNumber } from "./countryReference";
import { composeFullName, namesAreDuplicate, validateNamePart } from "./nameValidation";
import { validateDocumentNumber, type DocumentField } from "./documentNumberValidation";
import { validatePhoneNumber } from "./phoneValidation";

export interface ApplicantValidationInput {
  nationality: string;
  surname: string;
  givenNames: string;
  middleName: string;
  mononymDeclared: boolean;
  confirmNamesIntentionallyIdentical: boolean;
  idType: "International Passport" | "National ID";
  idNumber: string;
  idNumberOverrideConfirmed: boolean;
  requiresLicense: boolean;
  licenseNumber: string;
  licenseNumberOverrideConfirmed: boolean;
  address: string;
  phoneNumber: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
}

export interface ApplicantValidationNormalized {
  surname: string;
  givenNames: string;
  middleName: string;
  fullName: string;
  idNumberNormalized: string;
  phoneE164: string;
  guarantorPhoneE164: string;
}

export interface ApplicantValidationOutcome {
  valid: boolean;
  fieldErrors: Record<string, string>;
  warnings: Record<string, string>;
  normalized?: ApplicantValidationNormalized;
}

// The single shared validation entry point (spec §1) — run identically by
// ApplicantDetailsStep.tsx (client, instant feedback) and
// /api/submit-applicant (server, the actual authority per spec §0.1). Pure
// TypeScript, no browser-only APIs, so it works unmodified in both places.
export function validateApplicantPayload(input: ApplicantValidationInput): ApplicantValidationOutcome {
  const fieldErrors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  if (!isValidIso2(input.nationality)) {
    fieldErrors.nationality = "Please select a valid nationality.";
    return { valid: false, fieldErrors, warnings };
  }
  const rule = getCountryRule(input.nationality)!;

  const givenNames = input.givenNames.trim();
  const middleName = input.middleName.trim();
  let surname = input.surname.trim();

  if (input.mononymDeclared) {
    if (rule.mononym_allowed !== "yes") {
      fieldErrors.mononymDeclared = `${rule.country} nationals are expected to provide both a family name and given name(s).`;
    }
    const givenCheck = validateNamePart(givenNames, "Your name");
    if (!givenCheck.valid) fieldErrors.givenNames = givenCheck.message!;
    surname = givenNames;
  } else {
    const surnameCheck = validateNamePart(surname, "Family name");
    if (!surnameCheck.valid) fieldErrors.surname = surnameCheck.message!;
    const givenCheck = validateNamePart(givenNames, "Given name(s)");
    if (!givenCheck.valid) fieldErrors.givenNames = givenCheck.message!;
    if (
      !fieldErrors.surname &&
      !fieldErrors.givenNames &&
      namesAreDuplicate(surname, givenNames) &&
      !input.confirmNamesIntentionallyIdentical
    ) {
      fieldErrors.surname =
        "Family name and given name(s) are identical — tick the confirmation box if this is correct, or check for a copy-paste error.";
    }
  }

  if (middleName) {
    const middleCheck = validateNamePart(middleName, "Middle name");
    if (!middleCheck.valid) fieldErrors.middleName = middleCheck.message!;
  }

  const guarantorNameCheck = validateNamePart(input.guarantorName, "Guarantor name");
  if (!guarantorNameCheck.valid) fieldErrors.guarantorName = guarantorNameCheck.message!;

  if (!fieldErrors.surname && !fieldErrors.givenNames) {
    const fullNamePreview = composeFullName(surname, givenNames, middleName);
    if (input.guarantorName.trim().toLowerCase() === fullNamePreview.trim().toLowerCase()) {
      fieldErrors.guarantorName = "Your guarantor can't be yourself — please provide someone else's details.";
    }
  }

  if (!input.address.trim() || input.address.trim().length < 5) {
    fieldErrors.address = "Please enter your full residential address.";
  }
  if (!input.guarantorRelationship.trim()) {
    fieldErrors.guarantorRelationship = "Please describe your relationship to your guarantor.";
  }

  // idType is a business/compliance decision (spec §3.5), not purely
  // reference-data-driven: National ID is only ever collected for Kenyan
  // nationals, since that's the only national ID this business can actually
  // verify (via Smile Identity) and the only one it has a legitimate reason
  // to store.
  if (input.idType === "National ID" && input.nationality !== "KE") {
    fieldErrors.idType = "National ID is only available for Kenyan nationals. Please select International Passport.";
  }

  const idField: DocumentField = input.idType === "National ID" ? "national_id" : "passport";
  const idResult = validateDocumentNumber({ rawValue: input.idNumber, field: idField, iso2: input.nationality, rule });
  if (idResult.outcome === "reject") {
    fieldErrors.idNumber = idResult.message!;
  } else if (idResult.outcome === "warn" && !input.idNumberOverrideConfirmed) {
    warnings.idNumber = idResult.message!;
  }

  if (input.requiresLicense) {
    if (!input.licenseNumber.trim()) {
      fieldErrors.licenseNumber = "Driving licence number is required for self-drive.";
    } else {
      const licenseResult = validateDocumentNumber({
        rawValue: input.licenseNumber,
        field: "driving_licence",
        iso2: input.nationality,
        rule,
      });
      if (licenseResult.outcome === "reject") {
        fieldErrors.licenseNumber = licenseResult.message!;
      } else if (licenseResult.outcome === "warn" && !input.licenseNumberOverrideConfirmed) {
        warnings.licenseNumber = licenseResult.message!;
      }
    }
  }

  const idNumberNormalized = normalizeDocumentNumber(input.idNumber);
  if (
    !fieldErrors.idNumber &&
    idNumberNormalized &&
    (idNumberNormalized === normalizeDocumentNumber(input.phoneNumber) ||
      idNumberNormalized === normalizeDocumentNumber(surname) ||
      idNumberNormalized === normalizeDocumentNumber(givenNames))
  ) {
    fieldErrors.idNumber = "Your document number can't be the same as your phone number or your name.";
  }

  const phoneResult = validatePhoneNumber(input.phoneNumber, input.nationality, "Phone number");
  if (!phoneResult.valid) fieldErrors.phoneNumber = phoneResult.message!;

  const guarantorPhoneResult = validatePhoneNumber(input.guarantorPhone, input.nationality, "Guarantor phone number");
  if (!guarantorPhoneResult.valid) fieldErrors.guarantorPhone = guarantorPhoneResult.message!;

  if (phoneResult.valid && guarantorPhoneResult.valid && phoneResult.e164 === guarantorPhoneResult.e164) {
    fieldErrors.guarantorPhone = "Guarantor phone number can't be the same as your own.";
  }

  const valid = Object.keys(fieldErrors).length === 0;
  if (!valid) {
    return { valid, fieldErrors, warnings };
  }

  const finalSurname = input.mononymDeclared ? givenNames : surname;
  return {
    valid: true,
    fieldErrors,
    warnings,
    normalized: {
      surname: finalSurname,
      givenNames,
      middleName,
      fullName: composeFullName(finalSurname, givenNames, middleName),
      idNumberNormalized,
      phoneE164: phoneResult.e164!,
      guarantorPhoneE164: guarantorPhoneResult.e164!,
    },
  };
}
