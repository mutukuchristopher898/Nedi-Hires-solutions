"use client";

import { useState } from "react";
import Link from "next/link";
import { classifications } from "@/lib/data";
import { findCatalogEntry, getMakes, getModelsForMake } from "@/lib/vehicleCatalog";
import { validateBusinessName } from "@/lib/formValidation/businessName";
import { validateEmail } from "@/lib/formValidation/email";
import { validateKenyanPlate } from "@/lib/formValidation/licensePlate";
import { Field, fieldClass } from "@/components/forms/shared";

type Stage = "account" | "unit" | "done";

const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function isAllowedDocument(file: File) {
  return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}

export default function PartnerOnboardingPage() {
  const [stage, setStage] = useState<Stage>("account");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [taxCredentialFile, setTaxCredentialFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [accountFieldErrors, setAccountFieldErrors] = useState<{ businessName?: boolean; businessEmail?: boolean }>({});
  const [accountFormError, setAccountFormError] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [unitFieldErrors, setUnitFieldErrors] = useState<{ licensePlate?: boolean }>({});
  const [unitFormError, setUnitFormError] = useState<string | null>(null);

  const makes = getMakes();
  const models = make ? getModelsForMake(make) : [];
  const catalogEntry = make && vehicleName ? findCatalogEntry(make, vehicleName) : undefined;

  return (
    <div className="container-shell max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-midnight">Partner Onboarding</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Register your business and submit your first vehicle for admin approval.
      </p>

      <ol className="mt-6 flex gap-4 text-sm">
        <StepPill active={stage === "account"} done={stage !== "account"} label="1. Account Creation" />
        <StepPill active={stage === "unit"} done={stage === "done"} label="2. Unit Specification" />
        <StepPill active={stage === "done"} done={false} label="3. Pending Review" />
      </ol>

      {stage === "account" && (
        <form
          noValidate
          className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            setAccountFormError(null);

            const nameResult = validateBusinessName(businessName, "Business / Host name");
            const emailResult = validateEmail(businessEmail, "Business email");
            setAccountFieldErrors({ businessName: !nameResult.valid, businessEmail: !emailResult.valid });

            if (!nameResult.valid || !emailResult.valid) {
              setAccountFormError("Please fix the highlighted fields below.");
              return;
            }
            if ((taxCredentialFile && !isAllowedDocument(taxCredentialFile)) || (identityFile && !isAllowedDocument(identityFile))) {
              setAccountFormError("Only image (JPG/PNG/WebP) or PDF files are accepted for document uploads.");
              return;
            }

            setStage("unit");
          }}
        >
          {accountFormError && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{accountFormError}</p>
          )}
          <Field label="Business / Host Name">
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={fieldClass(accountFieldErrors.businessName ? "reject" : undefined, "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none")}
              placeholder="e.g. Rift Valley Rides"
            />
          </Field>
          <Field label="Business Email">
            <input
              required
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="e.g. bookings@riftvalleyrides.co.ke"
              className={fieldClass(accountFieldErrors.businessEmail ? "reject" : undefined, "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none")}
            />
          </Field>
          <Field label="Tax Credential / Business License">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setTaxCredentialFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-midnight/70"
            />
          </Field>
          <Field label="Personal Identity Document (for individual hosts)">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setIdentityFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-midnight/70"
            />
          </Field>

          <button
            type="submit"
            className="rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
          >
            Continue to Vehicle Details
          </button>
        </form>
      )}

      {stage === "unit" && (
        <form
          className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            setUnitFormError(null);

            const plateResult = validateKenyanPlate(licensePlate);
            setUnitFieldErrors({ licensePlate: !plateResult.valid });

            if (!plateResult.valid) {
              setUnitFormError("Please fix the highlighted fields below.");
              return;
            }

            setStage("done");
          }}
        >
          {unitFormError && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{unitFormError}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make">
              <select
                required
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setVehicleName("");
                }}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                <option value="" disabled>
                  Select make
                </option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <select
                required
                disabled={!make}
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none disabled:opacity-60"
              >
                <option value="" disabled>
                  {make ? "Select model" : "Select a make first"}
                </option>
                {models.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <input required type="number" min={1990} max={2027} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="2023" />
            </Field>
            <Field label="License Plate">
              <input
                required
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className={fieldClass(unitFieldErrors.licensePlate ? "reject" : undefined, "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none")}
                placeholder="e.g. KDX 123A"
              />
            </Field>
            <Field label="Classification">
              <select required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none">
                {classifications.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuel Type">
              <select
                required
                key={catalogEntry?.model ?? "default"}
                defaultValue={catalogEntry?.fuelType[0] ?? "Petrol"}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                {(catalogEntry?.fuelType ?? ["Petrol", "Diesel", "Hybrid", "Electric"]).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission">
              <select
                required
                key={catalogEntry?.model ?? "default"}
                defaultValue={catalogEntry?.transmission[0] ?? "Automatic"}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none"
              >
                {(catalogEntry?.transmission ?? ["Automatic", "Manual"]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Capacity (seats)">
              <input required type="number" min={1} max={60} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="5" />
            </Field>
          </div>

          {catalogEntry && (
            <p className="rounded-md bg-offwhite px-3 py-2 text-xs text-midnight/60">
              Typical spec for {catalogEntry.make} {catalogEntry.model}: {catalogEntry.cc} ·{" "}
              common colours: {catalogEntry.colors.join(", ")}. General reference — confirm
              against your actual unit.
            </p>
          )}

          <button
            type="submit"
            className="rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
          >
            Submit for Admin Approval
          </button>
        </form>
      )}

      {stage === "done" && (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-2xl text-amber">
            ⏳
          </div>
          <h2 className="mt-4 text-xl font-semibold text-midnight">Submitted — Pending Review</h2>
          <p className="mt-1 text-sm text-midnight/60">
            {businessName || "Your business"} and {vehicleName || "your vehicle"} have been
            queued for manual and automated admin checks. You&apos;ll be notified once approved.
          </p>
          <Link
            href="/partners/dashboard"
            className="mt-6 inline-block rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
          >
            Go to Partner Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <li
      className={`rounded-full px-3 py-1.5 ${
        active
          ? "bg-emerald text-white font-medium"
          : done
          ? "bg-emerald/10 text-emerald-dark"
          : "bg-midnight/5 text-midnight/50"
      }`}
    >
      {label}
    </li>
  );
}
