"use client";

import { useState } from "react";
import type { BookingApplicant, DriveType, IdType } from "@/lib/types";
import { Field, inputClass } from "./shared";

export interface ApplicantSubmission extends BookingApplicant {
  idFile: File;
  licenseFile: File | null;
  passportPhotoFile: File;
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
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState<IdType>("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorRelationship, setGuarantorRelationship] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const requiresLicense = driveType === "self_drive";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Please enter your full name as it appears on your ID/Passport.");
      return;
    }
    if (!idFile || !passportPhotoFile) {
      setFormError("Please attach both your ID/passport scan and a passport photo.");
      return;
    }
    if (requiresLicense && (!licenseFile || !licenseNumber)) {
      setFormError("Self-drive requires your driving license number and a scan of it.");
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      idType,
      idNumber,
      licenseNumber,
      address,
      phoneNumber,
      guarantorName,
      guarantorPhone,
      guarantorRelationship,
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

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name (as on ID / Passport)">
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="ID type">
            <select value={idType} onChange={(e) => setIdType(e.target.value as IdType)} className={inputClass}>
              <option value="National ID">National ID</option>
              <option value="International Passport">International Passport</option>
            </select>
          </Field>
          <Field label="ID / Passport number">
            <input required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputClass} />
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
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className={inputClass}
                />
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
              placeholder="07XX XXX XXX"
              className={inputClass}
            />
          </Field>
          <Field label="Residential address">
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
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
                className={inputClass}
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                type="tel"
                value={guarantorPhone}
                onChange={(e) => setGuarantorPhone(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Relationship to you">
              <input
                required
                value={guarantorRelationship}
                onChange={(e) => setGuarantorRelationship(e.target.value)}
                placeholder="e.g. Spouse, Sibling, Colleague"
                className={inputClass}
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
