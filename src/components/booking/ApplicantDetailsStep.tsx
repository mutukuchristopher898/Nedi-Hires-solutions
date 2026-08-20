"use client";

import { useMemo, useState } from "react";
import type { DriveType, IdType } from "@/lib/types";
import { Field, inputClass } from "./shared";
import { getAllCountriesForSelect, getCountryRule } from "@/lib/documentValidation/countryReference";
import { getNameOrderLayout } from "@/lib/documentValidation/nameValidation";
import { validateDocumentNumber, type DocumentValidationResult } from "@/lib/documentValidation/documentNumberValidation";
import { validateApplicantPayload, type ApplicantValidationInput } from "@/lib/documentValidation/validateApplicant";

export interface ApplicantSubmission extends ApplicantValidationInput {
  idFile: File;
  licenseFile: File | null;
  passportPhotoFile: File;
}

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const COUNTRIES = getAllCountriesForSelect();

function isAllowedFile(file: File) {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

// Invalid fields are shown with a colored border only — no written
// explanation under the field itself (a summary banner still appears once,
// above the Continue button).
function fieldClass(state?: "reject" | "warn") {
  if (state === "reject") return `${inputClass} border-red-500 focus:border-red-500`;
  if (state === "warn") return `${inputClass} border-amber-500 focus:border-amber-500`;
  return inputClass;
}

export default function ApplicantDetailsStep({
  driveType,
  saving,
  onSubmit,
}: {
  driveType: DriveType;
  saving: boolean;
  onSubmit: (data: ApplicantSubmission) => void;
}) {
  const [nationality, setNationality] = useState("KE");
  const [surname, setSurname] = useState("");
  const [givenNames, setGivenNames] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [mononymDeclared, setMononymDeclared] = useState(false);
  const [confirmNamesIntentionallyIdentical, setConfirmNamesIntentionallyIdentical] = useState(false);

  const [idType, setIdType] = useState<IdType>("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [idNumberOverrideConfirmed, setIdNumberOverrideConfirmed] = useState(false);
  const [idNumberFeedback, setIdNumberFeedback] = useState<DocumentValidationResult | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseNumberOverrideConfirmed, setLicenseNumberOverrideConfirmed] = useState(false);
  const [licenseNumberFeedback, setLicenseNumberFeedback] = useState<DocumentValidationResult | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorRelationship, setGuarantorRelationship] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requiresLicense = driveType === "self_drive";
  const rule = useMemo(() => getCountryRule(nationality), [nationality]);
  const nameLayout = useMemo(() => getNameOrderLayout(rule?.name_order ?? "given-first"), [rule]);
  const showsGrandfatherSlot = nameLayout.some((slot) => slot.key === "grandfatherName");
  const isKenyan = nationality === "KE";

  const idSample = (idType === "National ID" ? rule?.national_id_sample : rule?.passport_sample) || "e.g. A1234567";
  const licenseSample = rule?.driving_licence_sample || "e.g. DL1234567";
  const phoneSample = rule?.phone_sample || "e.g. 0712 345 678";

  function handleNationalityChange(nextIso2: string) {
    setNationality(nextIso2);
    const nextRule = getCountryRule(nextIso2);
    if (nextIso2 !== "KE" && idType === "National ID") setIdType("International Passport");
    if (nextRule?.mononym_allowed !== "yes") setMononymDeclared(false);
    if (nextRule && !phoneNumber.trim()) setPhoneNumber(`${nextRule.calling_code} `);
    if (nextRule && !guarantorPhone.trim()) setGuarantorPhone(`${nextRule.calling_code} `);
  }

  function combinedMiddleName() {
    return showsGrandfatherSlot ? [middleName.trim(), grandfatherName.trim()].filter(Boolean).join(" ") : middleName;
  }

  function buildValidationInput(): ApplicantValidationInput {
    return {
      nationality,
      surname,
      givenNames,
      middleName: combinedMiddleName(),
      mononymDeclared,
      confirmNamesIntentionallyIdentical,
      idType,
      idNumber,
      idNumberOverrideConfirmed,
      requiresLicense,
      licenseNumber,
      licenseNumberOverrideConfirmed,
      address,
      phoneNumber,
      guarantorName,
      guarantorPhone,
      guarantorRelationship,
    };
  }

  function handleIdNumberBlur() {
    if (!rule || !idNumber.trim()) return;
    setIdNumberFeedback(
      validateDocumentNumber({
        rawValue: idNumber,
        field: idType === "National ID" ? "national_id" : "passport",
        iso2: nationality,
        rule,
      })
    );
  }

  function handleLicenseNumberBlur() {
    if (!rule || !licenseNumber.trim()) return;
    setLicenseNumberFeedback(validateDocumentNumber({ rawValue: licenseNumber, field: "driving_licence", iso2: nationality, rule }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!idFile || !passportPhotoFile) {
      setFormError("Please attach both your ID/passport scan and a passport photo.");
      return;
    }
    if (!isAllowedFile(idFile) || !isAllowedFile(passportPhotoFile) || (licenseFile && !isAllowedFile(licenseFile))) {
      setFormError("Only image (JPG/PNG/WebP) or PDF files are accepted for ID, license, and passport photo uploads.");
      return;
    }
    if (requiresLicense && !licenseFile) {
      setFormError("Self-drive requires a scan of your driving license.");
      return;
    }

    const validationInput = buildValidationInput();
    const result = validateApplicantPayload(validationInput);
    setFieldErrors(result.fieldErrors);

    if (!result.valid) {
      setFormError("Please fix the highlighted fields below before continuing.");
      return;
    }
    if (Object.keys(result.warnings).length > 0) {
      setFormError("Please review and tick the confirmation next to each highlighted field below.");
      return;
    }

    onSubmit({
      ...validationInput,
      idFile,
      licenseFile: requiresLicense ? licenseFile : null,
      passportPhotoFile,
    });
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">2. Applicant & Guarantor Details</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Required for identity verification before final settlement.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nationality">
            <select value={nationality} onChange={(e) => handleNationalityChange(e.target.value)} className={inputClass}>
              {COUNTRIES.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {rule?.mononym_allowed === "yes" && (
          <label className="flex items-center gap-2 text-sm text-midnight/70">
            <input
              type="checkbox"
              checked={mononymDeclared}
              onChange={(e) => setMononymDeclared(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            I have only one name on my travel document.
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {mononymDeclared ? (
            <Field label="Your name (as on document)">
              <input
                required
                value={givenNames}
                onChange={(e) => setGivenNames(e.target.value)}
                placeholder="e.g. Suharto"
                className={fieldClass(fieldErrors.givenNames ? "reject" : undefined)}
              />
            </Field>
          ) : (
            nameLayout.map((slot) => {
              if (slot.key === "surname") {
                return (
                  <Field key="surname" label={slot.label}>
                    <input
                      required
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Mwangi"
                      className={fieldClass(fieldErrors.surname ? "reject" : undefined)}
                    />
                    {fieldErrors.surname?.includes("identical") && (
                      <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                        <input
                          type="checkbox"
                          checked={confirmNamesIntentionallyIdentical}
                          onChange={(e) => setConfirmNamesIntentionallyIdentical(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-line"
                        />
                        My family name and given name(s) are genuinely the same.
                      </label>
                    )}
                  </Field>
                );
              }
              if (slot.key === "givenNames") {
                return (
                  <Field key="givenNames" label={slot.label}>
                    <input
                      required
                      value={givenNames}
                      onChange={(e) => setGivenNames(e.target.value)}
                      placeholder="e.g. Wanjiru Grace"
                      className={fieldClass(fieldErrors.givenNames ? "reject" : undefined)}
                    />
                  </Field>
                );
              }
              if (slot.key === "middleName") {
                return (
                  <Field key="middleName" label={slot.label}>
                    <input
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="e.g. Otieno"
                      className={fieldClass(fieldErrors.middleName ? "reject" : undefined)}
                    />
                  </Field>
                );
              }
              return (
                <Field key="grandfatherName" label={slot.label}>
                  <input
                    value={grandfatherName}
                    onChange={(e) => setGrandfatherName(e.target.value)}
                    placeholder="e.g. Hassan"
                    className={inputClass}
                  />
                </Field>
              );
            })
          )}

          <Field label="ID type">
            {isKenyan ? (
              <select value={idType} onChange={(e) => setIdType(e.target.value as IdType)} className={inputClass}>
                <option value="National ID">National ID</option>
                <option value="International Passport">International Passport</option>
              </select>
            ) : (
              <input value="International Passport" disabled className={`${inputClass} bg-offwhite text-midnight/50`} />
            )}
          </Field>
          <Field label={`${idType} number`}>
            <input
              required
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                setIdNumberOverrideConfirmed(false);
                setIdNumberFeedback(null);
              }}
              onBlur={handleIdNumberBlur}
              placeholder={idSample}
              className={fieldClass(fieldErrors.idNumber ? "reject" : idNumberFeedback?.outcome === "warn" ? "warn" : undefined)}
            />
            {!fieldErrors.idNumber && idNumberFeedback?.outcome === "warn" && (
              <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                <input
                  type="checkbox"
                  checked={idNumberOverrideConfirmed}
                  onChange={(e) => setIdNumberOverrideConfirmed(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line"
                />
                I confirm this number is correct.
              </label>
            )}
          </Field>
          <Field label="Upload ID / Passport scan">
            <input
              required
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-midnight/70"
            />
          </Field>
          <Field label="Upload passport photo">
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setPassportPhotoFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-midnight/70"
            />
          </Field>

          {requiresLicense && (
            <>
              <Field label="Driving license number">
                <input
                  required
                  value={licenseNumber}
                  onChange={(e) => {
                    setLicenseNumber(e.target.value);
                    setLicenseNumberOverrideConfirmed(false);
                    setLicenseNumberFeedback(null);
                  }}
                  onBlur={handleLicenseNumberBlur}
                  placeholder={licenseSample}
                  className={fieldClass(
                    fieldErrors.licenseNumber ? "reject" : licenseNumberFeedback?.outcome === "warn" ? "warn" : undefined
                  )}
                />
                {!fieldErrors.licenseNumber && licenseNumberFeedback?.outcome === "warn" && (
                  <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                    <input
                      type="checkbox"
                      checked={licenseNumberOverrideConfirmed}
                      onChange={(e) => setLicenseNumberOverrideConfirmed(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-line"
                    />
                    I confirm this number is correct.
                  </label>
                )}
                {rule?.idp_recommended === "yes" && (
                  <p className="mt-1 text-xs text-midnight/50">
                    An International Driving Permit is required alongside your national licence.
                  </p>
                )}
              </Field>
              <Field label="Upload driving license scan">
                <input
                  required
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-midnight/70"
                />
              </Field>
            </>
          )}

          <Field label="Phone number">
            <input
              required
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={phoneSample}
              className={fieldClass(fieldErrors.phoneNumber ? "reject" : undefined)}
            />
          </Field>
          <Field label="Residential address">
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Ngong Road, Nairobi"
              className={fieldClass(fieldErrors.address ? "reject" : undefined)}
            />
          </Field>
        </div>

        <div className="rounded-lg bg-offwhite p-4">
          <p className="text-xs font-medium text-midnight/60">Guarantor details</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label="Full name">
              <input
                required
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                placeholder="e.g. Jane Wanjiru"
                className={fieldClass(fieldErrors.guarantorName ? "reject" : undefined)}
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                type="tel"
                value={guarantorPhone}
                onChange={(e) => setGuarantorPhone(e.target.value)}
                placeholder={phoneSample}
                className={fieldClass(fieldErrors.guarantorPhone ? "reject" : undefined)}
              />
            </Field>
            <Field label="Relationship to you">
              <input
                required
                value={guarantorRelationship}
                onChange={(e) => setGuarantorRelationship(e.target.value)}
                placeholder="e.g. Spouse, Sibling, Colleague"
                className={fieldClass(fieldErrors.guarantorRelationship ? "reject" : undefined)}
              />
            </Field>
          </div>
        </div>

        {formError && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Uploading…" : "Continue"}
        </button>
      </form>
    </section>
  );
}
