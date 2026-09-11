"use client";

import { useMemo, useState } from "react";
import type { DriveType, IdType } from "@/lib/types";
import { Field, fieldProps, FormError, inputClass } from "./shared";
import { getAllCountriesForSelect, getCountryRule } from "@/lib/documentValidation/countryReference";
import { getNameOrderLayout } from "@/lib/documentValidation/nameValidation";
import { validateDocumentNumber, type DocumentValidationResult } from "@/lib/documentValidation/documentNumberValidation";
import { validateApplicantPayload, type ApplicantValidationInput } from "@/lib/documentValidation/validateApplicant";
import { MAX_UPLOAD_LABEL, isAllowedUpload, isWithinSizeLimit } from "@/lib/uploads";

// The user-entered fields only — excludes the 3 File objects (which can't
// survive sessionStorage / a back-navigation remount, see the notice below)
// and `requiresLicense` (derived from the `driveType` prop, never typed).
export interface ApplicantDraftFields {
  nationality: string;
  surname: string;
  givenNames: string;
  middleName: string;
  grandfatherName: string;
  mononymDeclared: boolean;
  confirmNamesIntentionallyIdentical: boolean;
  idType: IdType;
  idNumber: string;
  idNumberOverrideConfirmed: boolean;
  licenseNumber: string;
  licenseNumberOverrideConfirmed: boolean;
  address: string;
  phoneNumber: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
}

export const APPLICANT_DRAFT_DEFAULTS: ApplicantDraftFields = {
  nationality: "KE",
  surname: "",
  givenNames: "",
  middleName: "",
  grandfatherName: "",
  mononymDeclared: false,
  confirmNamesIntentionallyIdentical: false,
  idType: "National ID",
  idNumber: "",
  idNumberOverrideConfirmed: false,
  licenseNumber: "",
  licenseNumberOverrideConfirmed: false,
  address: "",
  phoneNumber: "",
  guarantorName: "",
  guarantorPhone: "",
  guarantorRelationship: "",
};

export interface ApplicantSubmission extends ApplicantValidationInput {
  idFile: File;
  licenseFile: File | null;
  passportPhotoFile: File;
}

const COUNTRIES = getAllCountriesForSelect();

export default function ApplicantDetailsStep({
  value,
  onChange,
  driveType,
  saving,
  onSubmit,
}: {
  value: ApplicantDraftFields;
  onChange: (patch: Partial<ApplicantDraftFields>) => void;
  driveType: DriveType;
  saving: boolean;
  onSubmit: (data: ApplicantSubmission) => void;
}) {
  const {
    nationality,
    surname,
    givenNames,
    middleName,
    grandfatherName,
    mononymDeclared,
    confirmNamesIntentionallyIdentical,
    idType,
    idNumber,
    idNumberOverrideConfirmed,
    licenseNumber,
    licenseNumberOverrideConfirmed,
    address,
    phoneNumber,
    guarantorName,
    guarantorPhone,
    guarantorRelationship,
  } = value;

  const [idNumberFeedback, setIdNumberFeedback] = useState<DocumentValidationResult | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  const [licenseNumberFeedback, setLicenseNumberFeedback] = useState<DocumentValidationResult | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const requiresLicense = driveType === "self_drive";
  const rule = useMemo(() => getCountryRule(nationality), [nationality]);
  const nameLayout = useMemo(() => getNameOrderLayout(rule?.name_order ?? "given-first"), [rule]);
  const showsGrandfatherSlot = nameLayout.some((slot) => slot.key === "grandfatherName");
  const isKenyan = nationality === "KE";

  // If the customer already typed their details on a previous visit to this
  // step (surname is filled) but the local file state is empty, they must
  // have navigated away and back — file inputs can never be restored by JS
  // once a browser tab has moved on, for security reasons.
  const showReattachNotice = surname.trim() !== "" && !idFile && !passportPhotoFile;

  const idSample = (idType === "National ID" ? rule?.national_id_sample : rule?.passport_sample) || "e.g. A1234567";
  const licenseSample = rule?.driving_licence_sample || "e.g. DL1234567";
  const phoneSample = rule?.phone_sample || "e.g. 0712 345 678";

  function handleNationalityChange(nextIso2: string) {
    const nextRule = getCountryRule(nextIso2);
    const patch: Partial<ApplicantDraftFields> = { nationality: nextIso2 };
    if (nextIso2 !== "KE" && idType === "National ID") patch.idType = "International Passport";
    if (nextRule?.mononym_allowed !== "yes") patch.mononymDeclared = false;
    if (nextRule && !phoneNumber.trim()) patch.phoneNumber = `${nextRule.calling_code} `;
    if (nextRule && !guarantorPhone.trim()) patch.guarantorPhone = `${nextRule.calling_code} `;
    onChange(patch);
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
    const uploads = [idFile, passportPhotoFile, ...(licenseFile ? [licenseFile] : [])];
    if (uploads.some((f) => !isWithinSizeLimit(f))) {
      setFormError(`Each uploaded file must be ${MAX_UPLOAD_LABEL} or smaller.`);
      return;
    }
    if (uploads.some((f) => !isAllowedUpload(f))) {
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
              onChange={(e) => onChange({ mononymDeclared: e.target.checked })}
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
                onChange={(e) => onChange({ givenNames: e.target.value })}
                placeholder="e.g. Suharto"
                {...fieldProps(fieldErrors.givenNames ? "reject" : undefined)}
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
                      onChange={(e) => onChange({ surname: e.target.value })}
                      placeholder="e.g. Mwangi"
                      {...fieldProps(fieldErrors.surname ? "reject" : undefined)}
                    />
                    {fieldErrors.surname?.includes("identical") && (
                      <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                        <input
                          type="checkbox"
                          checked={confirmNamesIntentionallyIdentical}
                          onChange={(e) => onChange({ confirmNamesIntentionallyIdentical: e.target.checked })}
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
                      onChange={(e) => onChange({ givenNames: e.target.value })}
                      placeholder="e.g. Wanjiru Grace"
                      {...fieldProps(fieldErrors.givenNames ? "reject" : undefined)}
                    />
                  </Field>
                );
              }
              if (slot.key === "middleName") {
                return (
                  <Field key="middleName" label={slot.label}>
                    <input
                      value={middleName}
                      onChange={(e) => onChange({ middleName: e.target.value })}
                      placeholder="e.g. Otieno"
                      {...fieldProps(fieldErrors.middleName ? "reject" : undefined)}
                    />
                  </Field>
                );
              }
              return (
                <Field key="grandfatherName" label={slot.label}>
                  <input
                    value={grandfatherName}
                    onChange={(e) => onChange({ grandfatherName: e.target.value })}
                    placeholder="e.g. Hassan"
                    className={inputClass}
                  />
                </Field>
              );
            })
          )}

          <Field label="ID type">
            {isKenyan ? (
              <select value={idType} onChange={(e) => onChange({ idType: e.target.value as IdType })} className={inputClass}>
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
                onChange({ idNumber: e.target.value, idNumberOverrideConfirmed: false });
                setIdNumberFeedback(null);
              }}
              onBlur={handleIdNumberBlur}
              placeholder={idSample}
              {...fieldProps(fieldErrors.idNumber ? "reject" : idNumberFeedback?.outcome === "warn" ? "warn" : undefined)}
            />
            {!fieldErrors.idNumber && idNumberFeedback?.outcome === "warn" && (
              <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                <input
                  type="checkbox"
                  checked={idNumberOverrideConfirmed}
                  onChange={(e) => onChange({ idNumberOverrideConfirmed: e.target.checked })}
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
                    onChange({ licenseNumber: e.target.value, licenseNumberOverrideConfirmed: false });
                    setLicenseNumberFeedback(null);
                  }}
                  onBlur={handleLicenseNumberBlur}
                  placeholder={licenseSample}
                  {...fieldProps(
                    fieldErrors.licenseNumber ? "reject" : licenseNumberFeedback?.outcome === "warn" ? "warn" : undefined
                  )}
                />
                {!fieldErrors.licenseNumber && licenseNumberFeedback?.outcome === "warn" && (
                  <label className="mt-1 flex items-center gap-2 text-xs text-midnight/60">
                    <input
                      type="checkbox"
                      checked={licenseNumberOverrideConfirmed}
                      onChange={(e) => onChange({ licenseNumberOverrideConfirmed: e.target.checked })}
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
              onChange={(e) => onChange({ phoneNumber: e.target.value })}
              placeholder={phoneSample}
              {...fieldProps(fieldErrors.phoneNumber ? "reject" : undefined)}
            />
          </Field>
          <Field label="Residential address">
            <input
              required
              value={address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="e.g. 123 Ngong Road, Nairobi"
              {...fieldProps(fieldErrors.address ? "reject" : undefined)}
            />
          </Field>
        </div>

        {showReattachNotice && (
          <p className="rounded-md bg-amber/10 px-3 py-2 text-sm text-amber">
            Please re-attach your documents below — files can&apos;t be restored when you navigate back.
          </p>
        )}

        <div className="rounded-lg bg-offwhite p-4">
          <p className="text-xs font-medium text-midnight/60">Guarantor details</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label="Full name">
              <input
                required
                value={guarantorName}
                onChange={(e) => onChange({ guarantorName: e.target.value })}
                placeholder="e.g. Jane Wanjiru"
                {...fieldProps(fieldErrors.guarantorName ? "reject" : undefined)}
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                type="tel"
                value={guarantorPhone}
                onChange={(e) => onChange({ guarantorPhone: e.target.value })}
                placeholder={phoneSample}
                {...fieldProps(fieldErrors.guarantorPhone ? "reject" : undefined)}
              />
            </Field>
            <Field label="Relationship to you">
              <input
                required
                value={guarantorRelationship}
                onChange={(e) => onChange({ guarantorRelationship: e.target.value })}
                placeholder="e.g. Spouse, Sibling, Colleague"
                {...fieldProps(fieldErrors.guarantorRelationship ? "reject" : undefined)}
              />
            </Field>
          </div>
        </div>

        {formError && (
          <FormError message={formError} details={fieldErrors} />
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
