"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { classifications } from "@/lib/data";
import { findCatalogEntry, getMakes, getModelsForMake } from "@/lib/vehicleCatalog";
import { validateBusinessName } from "@/lib/formValidation/businessName";
import { validateEmail } from "@/lib/formValidation/email";
import { validateKenyanPlate } from "@/lib/formValidation/licensePlate";
import { Field, fieldProps, FormError } from "@/components/forms/shared";
import { uploadVehiclePhoto } from "@/lib/supabase/vehiclePhotos";
import {
  MAX_VEHICLE_PHOTO_LABEL,
  isAllowedVehiclePhoto,
  isVehiclePhotoWithinLimit,
} from "@/lib/uploads";
import type { PartnerAccount } from "@/lib/types";

type Stage = "account" | "unit" | "done";

const SELECT_CLASS =
  "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none";
const INPUT_CLASS = SELECT_CLASS;

// The pickup points the existing fleet already uses. Free text, because a
// partner may operate somewhere we haven't listed.
const COMMON_LOCATIONS = [
  "Nairobi CBD",
  "Jomo Kenyatta International Airport (JKIA)",
  "Mombasa Moi International Airport",
  "Kisumu",
];

const FEATURE_OPTIONS = [
  "Bluetooth",
  "USB Charging",
  "Reverse Camera",
  "Air Conditioning",
  "Fuel Efficient",
  "Spacious Boot",
  "GPS Navigation",
  "Child Seat Available",
];

export default function PartnerOnboardingForm({
  userId,
  existingPartner,
}: {
  userId: string;
  existingPartner: PartnerAccount | null;
}) {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerAccount | null>(existingPartner);
  const [stage, setStage] = useState<Stage>(existingPartner ? "unit" : "account");

  // ── Business step ──────────────────────────────────────────
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [accountFieldErrors, setAccountFieldErrors] = useState<{ businessName?: boolean; businessEmail?: boolean }>({});
  const [accountFormError, setAccountFormError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);

  // ── Vehicle step ───────────────────────────────────────────
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [classification, setClassification] = useState<string>(classifications[0]);
  const [fuelType, setFuelType] = useState("Petrol");
  const [transmission, setTransmission] = useState("Automatic");
  const [capacity, setCapacity] = useState("5");
  const [licensePlate, setLicensePlate] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [unitFieldErrors, setUnitFieldErrors] = useState<Record<string, boolean>>({});
  const [unitFormError, setUnitFormError] = useState<string | null>(null);
  const [savingUnit, setSavingUnit] = useState(false);
  const [listedName, setListedName] = useState("");

  const makes = getMakes();
  const models = make ? getModelsForMake(make) : [];
  const catalogEntry = make && model ? findCatalogEntry(make, model) : undefined;

  async function handleCreatePartner(e: React.FormEvent) {
    e.preventDefault();
    setAccountFormError(null);

    const nameResult = validateBusinessName(businessName, "Business / Host name");
    const emailResult = validateEmail(businessEmail, "Business email");
    setAccountFieldErrors({ businessName: !nameResult.valid, businessEmail: !emailResult.valid });

    if (!nameResult.valid || !emailResult.valid) {
      setAccountFormError("Please fix the highlighted fields below.");
      return;
    }

    setSavingAccount(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("partners")
      .insert({
        owner_profile_id: userId,
        business_name: businessName.trim(),
        business_email: businessEmail.trim(),
      })
      .select("id, business_name, business_email, status, created_at")
      .single();

    setSavingAccount(false);

    if (error) {
      setAccountFormError(error.message);
      return;
    }

    const row = data as { id: string; business_name: string; business_email: string | null; status: PartnerAccount["status"]; created_at: string };
    setPartner({
      id: row.id,
      businessName: row.business_name,
      businessEmail: row.business_email,
      status: row.status,
      createdAt: row.created_at,
    });
    setStage("unit");
  }

  async function handleListVehicle(e: React.FormEvent) {
    e.preventDefault();
    setUnitFormError(null);

    if (!partner) {
      setUnitFormError("Your partner account is missing. Please reload and try again.");
      return;
    }

    const plateResult = validateKenyanPlate(licensePlate);
    const yearNum = Number(year);
    const capacityNum = Number(capacity);
    const priceNum = Number(pricePerDay);

    const errors: Record<string, boolean> = {
      make: !make,
      model: !model,
      year: !Number.isInteger(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1,
      licensePlate: !plateResult.valid,
      location: location.trim().length < 2,
      capacity: !Number.isInteger(capacityNum) || capacityNum < 1 || capacityNum > 60,
      pricePerDay: !(priceNum > 0),
    };
    setUnitFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setUnitFormError("Please fix the highlighted fields below.");
      return;
    }

    // Enforced again by the database before approval, but asking here means a
    // partner isn't told weeks later that their listing can't go live.
    if (photos.length === 0) {
      setUnitFormError("Add at least one photograph — a vehicle can't be approved without one.");
      return;
    }
    if (photos.some((p) => !isAllowedVehiclePhoto(p))) {
      setUnitFormError("Photos must be JPG, PNG or WebP.");
      return;
    }
    if (photos.some((p) => !isVehiclePhotoWithinLimit(p))) {
      setUnitFormError(`Each photo must be ${MAX_VEHICLE_PHOTO_LABEL} or smaller.`);
      return;
    }

    setSavingUnit(true);

    try {
      // Photos first: a vehicle row with no images is a listing that can never
      // be approved, so nothing is inserted until the uploads have landed.
      const photoPaths: string[] = [];
      for (const photo of photos) {
        photoPaths.push(await uploadVehiclePhoto({ userId, file: photo }));
      }

      const supabase = createClient();
      const { error } = await supabase.from("vehicles").insert({
        partner_id: partner.id,
        make,
        model,
        year: yearNum,
        classification,
        fuel_type: fuelType,
        transmission,
        capacity: capacityNum,
        license_plate: licensePlate.trim().toUpperCase(),
        location: location.trim(),
        price_per_day: priceNum,
        currency: "KES",
        description: description.trim(),
        features,
        photo_paths: photoPaths,
        // approval_status defaults to 'pending'; the slug is minted by trigger.
      });

      if (error) {
        setSavingUnit(false);
        setUnitFormError(error.message);
        return;
      }

      setListedName(`${make} ${model} ${year}`);
      setSavingUnit(false);
      setStage("done");
      router.refresh();
    } catch (uploadError) {
      setSavingUnit(false);
      setUnitFormError(
        uploadError instanceof Error ? uploadError.message : "Could not upload your photos. Please try again."
      );
    }
  }

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    );
  }

  return (
    <div className="container-shell max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-midnight">
        {partner ? `List a vehicle — ${partner.businessName}` : "Partner Onboarding"}
      </h1>
      <p className="mt-1 text-sm text-midnight/60">
        {partner
          ? "Add a vehicle to your fleet. It goes live once an admin approves it."
          : "Register your business, then list your first vehicle for approval."}
      </p>

      <ol className="mt-6 flex flex-wrap gap-4 text-sm">
        <StepPill active={stage === "account"} done={stage !== "account"} label="1. Business Details" />
        <StepPill active={stage === "unit"} done={stage === "done"} label="2. Vehicle Details" />
        <StepPill active={stage === "done"} done={false} label="3. Pending Review" />
      </ol>

      {stage === "account" && (
        <form noValidate onSubmit={handleCreatePartner} className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
          {accountFormError && <FormError message={accountFormError} details={accountFieldErrors} />}

          <Field label="Business / Host Name">
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Rift Valley Rides"
              {...fieldProps(accountFieldErrors.businessName ? "reject" : undefined, INPUT_CLASS)}
            />
          </Field>
          <Field label="Business Email">
            <input
              required
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              placeholder="e.g. bookings@riftvalleyrides.co.ke"
              {...fieldProps(accountFieldErrors.businessEmail ? "reject" : undefined, INPUT_CLASS)}
            />
          </Field>

          <button
            type="submit"
            disabled={savingAccount}
            className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
          >
            {savingAccount ? "Creating account…" : "Continue to Vehicle Details"}
          </button>
        </form>
      )}

      {stage === "unit" && (
        <form noValidate onSubmit={handleListVehicle} className="mt-8 space-y-4 rounded-2xl bg-white p-6 ring-1 ring-line">
          {unitFormError && <FormError message={unitFormError} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make">
              <select
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel("");
                }}
                {...fieldProps(unitFieldErrors.make ? "reject" : undefined, SELECT_CLASS)}
              >
                <option value="">Select make</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <select
                disabled={!make}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                {...fieldProps(unitFieldErrors.model ? "reject" : undefined, `${SELECT_CLASS} disabled:opacity-60`)}
              >
                <option value="">{make ? "Select model" : "Select a make first"}</option>
                {models.map((m) => (
                  <option key={m.model} value={m.model}>{m.model}</option>
                ))}
              </select>
            </Field>
            <Field label="Year">
              <input
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2019"
                {...fieldProps(unitFieldErrors.year ? "reject" : undefined, INPUT_CLASS)}
              />
            </Field>
            <Field label="License Plate">
              <input
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g. KDX 123A"
                {...fieldProps(unitFieldErrors.licensePlate ? "reject" : undefined, INPUT_CLASS)}
              />
            </Field>
            <Field label="Classification">
              <select value={classification} onChange={(e) => setClassification(e.target.value)} className={SELECT_CLASS}>
                {classifications.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuel Type">
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)} className={SELECT_CLASS}>
                {(catalogEntry?.fuelType ?? ["Petrol", "Diesel", "Hybrid", "Electric"]).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Transmission">
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={SELECT_CLASS}>
                {(catalogEntry?.transmission ?? ["Automatic", "Manual"]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Capacity (seats)">
              <input
                type="number"
                min={1}
                max={60}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                {...fieldProps(unitFieldErrors.capacity ? "reject" : undefined, INPUT_CLASS)}
              />
            </Field>
            <Field label="Pickup Location">
              <input
                list="partner-locations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nairobi CBD"
                {...fieldProps(unitFieldErrors.location ? "reject" : undefined, INPUT_CLASS)}
              />
              <datalist id="partner-locations">
                {COMMON_LOCATIONS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </Field>
            <Field label="Price per day (KES)">
              <input
                type="number"
                min={1}
                step={100}
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                placeholder="e.g. 4500"
                {...fieldProps(unitFieldErrors.pricePerDay ? "reject" : undefined, INPUT_CLASS)}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Well-maintained saloon, serviced monthly, ideal for city driving and airport runs."
              className={INPUT_CLASS}
            />
          </Field>

          <fieldset>
            <legend className="text-xs font-medium text-midnight/60">Features</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map((f) => (
                <label
                  key={f}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                    features.includes(f)
                      ? "bg-gold text-midnight ring-gold"
                      : "bg-white text-midnight/60 ring-line hover:bg-midnight/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={features.includes(f)}
                    onChange={() => toggleFeature(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Photographs">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-midnight/70"
            />
            <p className="mt-1 text-xs text-midnight/50">
              At least one is required — a vehicle can&apos;t go live without a photo. JPG, PNG or
              WebP, up to {MAX_VEHICLE_PHOTO_LABEL} each. The first is used as the main listing image.
            </p>
            {photos.length > 0 && (
              <p className="mt-1 text-xs text-midnight/60">
                {photos.length} photo{photos.length === 1 ? "" : "s"} selected.
              </p>
            )}
          </Field>

          {catalogEntry && (
            <p className="rounded-md bg-offwhite px-3 py-2 text-xs text-midnight/60">
              Typical spec for {catalogEntry.make} {catalogEntry.model}: {catalogEntry.cc} · common
              colours: {catalogEntry.colors.join(", ")}. General reference — confirm against your
              actual unit.
            </p>
          )}

          <button
            type="submit"
            disabled={savingUnit}
            className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
          >
            {savingUnit ? "Submitting…" : "Submit for Approval"}
          </button>
        </form>
      )}

      {stage === "done" && (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-2xl text-amber">
            ⏳
          </div>
          <h2 className="mt-4 text-xl font-semibold text-midnight">Submitted for review</h2>
          <p className="mt-1 text-sm text-midnight/60">
            {listedName || "Your vehicle"} has been added to {partner?.businessName ?? "your fleet"} and is
            awaiting admin approval. It appears in search as soon as it&apos;s approved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/partners/dashboard"
              className="rounded-md bg-midnight px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal"
            >
              Go to Partner Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setMake("");
                setModel("");
                setYear("");
                setLicensePlate("");
                setLocation("");
                setPricePerDay("");
                setDescription("");
                setFeatures([]);
                setPhotos([]);
                setUnitFieldErrors({});
                setStage("unit");
              }}
              className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
            >
              List another vehicle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepPill({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <li
      className={`rounded-full px-3 py-1.5 ${
        active ? "bg-gold text-midnight font-medium" : done ? "bg-gold/10 text-gold-dark" : "bg-midnight/5 text-midnight/50"
      }`}
    >
      {label}
    </li>
  );
}
