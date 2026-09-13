"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { classifications } from "@/lib/data";
import { validateKenyanPlate } from "@/lib/formValidation/licensePlate";
import { Field, fieldProps, FormError } from "@/components/forms/shared";
import { uploadVehiclePhoto, publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import { MAX_VEHICLE_PHOTO_LABEL, isAllowedVehiclePhoto, isVehiclePhotoWithinLimit } from "@/lib/uploads";
import type { AdminVehicle, PartnerOption } from "@/lib/supabase/queries";

const INPUT = "w-full rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none";

const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];
const TRANSMISSIONS = ["Automatic", "Manual"];

export default function VehicleForm({
  vehicle,
  partners,
  featureOptions,
  locationOptions,
}: {
  /** Absent when creating. */
  vehicle?: AdminVehicle;
  partners: PartnerOption[];
  /** Both editable at /admin/settings. */
  featureOptions: string[];
  locationOptions: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);

  const [partnerId, setPartnerId] = useState(vehicle?.partnerId ?? "");
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [year, setYear] = useState(vehicle ? String(vehicle.year) : "");
  const [classification, setClassification] = useState<string>(vehicle?.classification ?? classifications[0]);
  const [fuelType, setFuelType] = useState<string>(vehicle?.fuelType ?? "Petrol");
  const [transmission, setTransmission] = useState<string>(vehicle?.transmission ?? "Automatic");
  const [capacity, setCapacity] = useState(vehicle ? String(vehicle.capacity) : "5");
  const [licensePlate, setLicensePlate] = useState(vehicle?.licensePlate ?? "");
  const [location, setLocation] = useState(vehicle?.location ?? "");
  const [pricePerDay, setPricePerDay] = useState(vehicle ? String(vehicle.pricePerDay) : "");
  const [description, setDescription] = useState(vehicle?.description ?? "");
  const [features, setFeatures] = useState<string[]>(vehicle?.features ?? []);

  // Order is meaningful: the first is the listing's main image.
  const [photoPaths, setPhotoPaths] = useState<string[]>(vehicle?.photoPaths ?? []);
  const [uploading, setUploading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleFeature(feature: string) {
    setFeatures((current) =>
      current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature]
    );
    setSaved(false);
  }

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError(null);
    const chosen = Array.from(files);

    if (chosen.some((f) => !isAllowedVehiclePhoto(f))) {
      setError("Photos must be JPG, PNG or WebP.");
      return;
    }
    if (chosen.some((f) => !isVehiclePhotoWithinLimit(f))) {
      setError(`Each photo must be ${MAX_VEHICLE_PHOTO_LABEL} or smaller.`);
      return;
    }

    setUploading(true);
    try {
      // Uploaded as they are chosen rather than on submit, so a slow upload
      // doesn't look like a stuck save button.
      const uploaded: string[] = [];
      for (const file of chosen) {
        uploaded.push(await uploadVehiclePhoto({ file }));
      }
      setPhotoPaths((current) => [...current, ...uploaded]);
      setSaved(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= photoPaths.length) return;
    setPhotoPaths((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSaved(false);
  }

  function removePhoto(index: number) {
    setPhotoPaths((current) => current.filter((_, i) => i !== index));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const plateResult = validateKenyanPlate(licensePlate);
    const yearNum = Number(year);
    const capacityNum = Number(capacity);
    const priceNum = Number(pricePerDay);

    const errors: Record<string, boolean> = {
      make: !make.trim(),
      model: !model.trim(),
      year: !Number.isInteger(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1,
      licensePlate: !plateResult.valid,
      location: location.trim().length < 2,
      capacity: !Number.isInteger(capacityNum) || capacityNum < 1 || capacityNum > 60,
      pricePerDay: !(priceNum > 0),
    };
    setFieldErrors(errors);

    if (Object.values(errors).some(Boolean)) {
      setError("Please fix the highlighted fields below.");
      return;
    }

    setSaving(true);

    const payload = {
      partner_id: partnerId || null,
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
      classification,
      fuel_type: fuelType,
      transmission,
      capacity: capacityNum,
      license_plate: licensePlate.trim().toUpperCase(),
      location: location.trim(),
      price_per_day: priceNum,
      description: description.trim(),
      features,
      photo_paths: photoPaths,
    };

    const supabase = createClient();

    // Asking for the row back on both paths: an update matching nothing is a
    // success to PostgREST, so this is what turns a silent no-op into an error.
    const { data, error: writeError } = isEdit
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle!.id).select("id")
      : await supabase.from("vehicles").insert({ ...payload, currency: "KES" }).select("id");

    setSaving(false);

    if (writeError) {
      setError(writeError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("That didn't save — you may not have permission.");
      return;
    }

    setSaved(true);
    router.refresh();
    if (!isEdit) router.push(`/admin/vehicles/${data[0].id}`);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl bg-white p-6 ring-1 ring-line">
      {error && <FormError message={error} details={fieldErrors} />}

      <Field label="Partner">
        <select
          value={partnerId}
          onChange={(e) => { setPartnerId(e.target.value); setSaved(false); }}
          className={INPUT}
        >
          <option value="">No partner — listed directly</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.businessName}
              {p.status !== "approved" ? ` (${p.status})` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-midnight/50">
          Attributing a vehicle to a partner shows their name on the listing.
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make">
          <input value={make} onChange={(e) => { setMake(e.target.value); setSaved(false); }}
            placeholder="e.g. Toyota" {...fieldProps(fieldErrors.make ? "reject" : undefined, INPUT)} />
        </Field>
        <Field label="Model">
          <input value={model} onChange={(e) => { setModel(e.target.value); setSaved(false); }}
            placeholder="e.g. Axio" {...fieldProps(fieldErrors.model ? "reject" : undefined, INPUT)} />
        </Field>
        <Field label="Year">
          <input type="number" min={1990} max={new Date().getFullYear() + 1} value={year}
            onChange={(e) => { setYear(e.target.value); setSaved(false); }} placeholder="e.g. 2019"
            {...fieldProps(fieldErrors.year ? "reject" : undefined, INPUT)} />
        </Field>
        <Field label="Registration number">
          <input value={licensePlate} onChange={(e) => { setLicensePlate(e.target.value); setSaved(false); }}
            placeholder="e.g. KDX 123A" {...fieldProps(fieldErrors.licensePlate ? "reject" : undefined, INPUT)} />
        </Field>
        <Field label="Class">
          <select value={classification} onChange={(e) => { setClassification(e.target.value); setSaved(false); }} className={INPUT}>
            {classifications.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Fuel type">
          <select value={fuelType} onChange={(e) => { setFuelType(e.target.value); setSaved(false); }} className={INPUT}>
            {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Transmission">
          <select value={transmission} onChange={(e) => { setTransmission(e.target.value); setSaved(false); }} className={INPUT}>
            {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Seats">
          <input type="number" min={1} max={60} value={capacity}
            onChange={(e) => { setCapacity(e.target.value); setSaved(false); }}
            {...fieldProps(fieldErrors.capacity ? "reject" : undefined, INPUT)} />
        </Field>
        <Field label="Pickup location">
          <input list="admin-vehicle-locations" value={location}
            onChange={(e) => { setLocation(e.target.value); setSaved(false); }} placeholder="e.g. Nairobi CBD"
            {...fieldProps(fieldErrors.location ? "reject" : undefined, INPUT)} />
          <datalist id="admin-vehicle-locations">
            {locationOptions.map((l) => <option key={l} value={l} />)}
          </datalist>
        </Field>
        <Field label="Daily rate (KES)">
          <input type="number" min={1} step={100} value={pricePerDay}
            onChange={(e) => { setPricePerDay(e.target.value); setSaved(false); }} placeholder="e.g. 4500"
            {...fieldProps(fieldErrors.pricePerDay ? "reject" : undefined, INPUT)} />
        </Field>
      </div>

      <Field label="Description">
        <textarea rows={3} value={description}
          onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
          placeholder="e.g. Well-maintained saloon, serviced monthly, ideal for city driving."
          className={INPUT} />
      </Field>

      <fieldset>
        <legend className="text-xs font-medium text-midnight/60">Features</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {featureOptions.map((f) => (
            <label key={f} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
              features.includes(f) ? "bg-gold text-midnight ring-gold" : "bg-white text-midnight/60 ring-line hover:bg-midnight/5"
            }`}>
              <input type="checkbox" className="sr-only" checked={features.includes(f)} onChange={() => toggleFeature(f)} />
              {f}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-midnight/60">Photographs</legend>
        <p className="mt-1 text-xs text-midnight/50">
          The first is the main listing image. Photos are re-encoded on upload, which strips the
          location data phones embed. A vehicle needs at least one before it can be approved.
        </p>

        {photoPaths.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-3">
            {photoPaths.map((path, index) => (
              <li key={path} className="relative">
                <Image
                  src={publicVehiclePhotoUrl(path)}
                  alt={index === 0 ? "Main listing photo" : `Photo ${index + 1}`}
                  width={128}
                  height={96}
                  className={`h-24 w-32 rounded-lg object-cover ring-2 ${index === 0 ? "ring-gold" : "ring-transparent"}`}
                />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-midnight">
                    Main
                  </span>
                )}
                <div className="mt-1 flex justify-center gap-1">
                  <button type="button" onClick={() => movePhoto(index, index - 1)} disabled={index === 0}
                    aria-label={`Move photo ${index + 1} earlier`}
                    className="rounded border border-line px-1.5 text-xs text-midnight/60 disabled:opacity-30">←</button>
                  <button type="button" onClick={() => movePhoto(index, index + 1)} disabled={index === photoPaths.length - 1}
                    aria-label={`Move photo ${index + 1} later`}
                    className="rounded border border-line px-1.5 text-xs text-midnight/60 disabled:opacity-30">→</button>
                  <button type="button" onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="rounded border border-red-500/40 px-1.5 text-xs text-red-600">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading}
          onChange={(e) => handlePhotos(e.target.files)}
          className="mt-3 block w-full text-sm text-midnight/70 disabled:opacity-60" />
        {uploading && <p className="mt-1 text-xs text-midnight/60">Uploading…</p>}
      </fieldset>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <button type="submit" disabled={saving || uploading}
          className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create vehicle"}
        </button>
        {saved && <span className="text-sm text-emerald-dark">Saved.</span>}
        {isEdit && vehicle && (
          <span className="ml-auto text-xs text-midnight/50">
            Status: {vehicle.lifecycle}
          </span>
        )}
      </div>
    </form>
  );
}
