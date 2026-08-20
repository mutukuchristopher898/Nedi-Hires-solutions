"use client";

import { useState } from "react";
import type { TripDetails, Vehicle } from "@/lib/types";
import { calculateAge, calculateYearsSince, MIN_LICENSE_YEARS, MIN_SELF_DRIVE_AGE } from "@/lib/eligibility";
import { Field, inputClass } from "./shared";

const PICKUP_POINTS = [
  "Jomo Kenyatta International Airport (JKIA)",
  "Nairobi CBD",
  "Mombasa Moi International Airport",
  "Kisumu",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function TripDetailsStep({
  vehicle,
  initial,
  saving,
  onSubmit,
}: {
  vehicle: Vehicle;
  initial: TripDetails;
  saving: boolean;
  onSubmit: (trip: TripDetails) => void;
}) {
  const [trip, setTrip] = useState<TripDetails>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  const age = trip.dateOfBirth ? calculateAge(trip.dateOfBirth) : null;
  const licenseYears = trip.licenseIssueDate ? calculateYearsSince(trip.licenseIssueDate) : null;
  const ageOk = age === null || age >= MIN_SELF_DRIVE_AGE;
  const licenseOk = licenseYears === null || licenseYears >= MIN_LICENSE_YEARS;

  function update<K extends keyof TripDetails>(key: K, value: TripDetails[K]) {
    setTrip((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (trip.driveType === "self_drive") {
      const finalAge = calculateAge(trip.dateOfBirth);
      const finalLicenseYears = calculateYearsSince(trip.licenseIssueDate);

      if (finalAge < MIN_SELF_DRIVE_AGE) {
        setFormError(`For self-drive, the hirer must be at least ${MIN_SELF_DRIVE_AGE} years old.`);
        return;
      }
      if (finalLicenseYears < MIN_LICENSE_YEARS) {
        setFormError(`For self-drive, the hirer's license must be at least ${MIN_LICENSE_YEARS} years old.`);
        return;
      }
    }

    onSubmit(trip);
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">1. Trip Details</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Tell us about your trip with the {vehicle.make} {vehicle.model}.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup date">
            <input
              required
              type="date"
              min={todayIso()}
              value={trip.pickupDate}
              onChange={(e) => update("pickupDate", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Rental duration (days)">
            <input
              required
              type="number"
              min={1}
              max={30}
              value={trip.days}
              onChange={(e) => update("days", Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </Field>
          <Field label="Pickup point">
            <input
              required
              list="pickup-points"
              value={trip.pickupPoint}
              onChange={(e) => update("pickupPoint", e.target.value)}
              className={inputClass}
            />
            <datalist id="pickup-points">
              {PICKUP_POINTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
          <Field label="Destination">
            <input
              required
              value={trip.destination}
              onChange={(e) => update("destination", e.target.value)}
              placeholder="e.g. Naivasha, Diani Beach"
              className={inputClass}
            />
          </Field>
          <Field label="Purpose">
            <select
              value={trip.purpose}
              onChange={(e) => update("purpose", e.target.value as TripDetails["purpose"])}
              className={inputClass}
            >
              <option value="personal">Personal</option>
              <option value="commercial">Commercial</option>
            </select>
          </Field>
          <Field label="Driving arrangement">
            <select
              value={trip.driveType}
              onChange={(e) => update("driveType", e.target.value as TripDetails["driveType"])}
              className={inputClass}
            >
              <option value="self_drive">Self-drive</option>
              <option value="chauffeur">Chauffeur-driven</option>
            </select>
          </Field>
          <Field label="Your date of birth">
            <input
              required
              type="date"
              value={trip.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={inputClass}
            />
            {trip.driveType === "self_drive" && age !== null && (
              <p className={`mt-1 text-xs ${ageOk ? "text-emerald-dark" : "text-red-600"}`}>
                Age: {age} {ageOk ? "✓" : `— must be ${MIN_SELF_DRIVE_AGE}+`}
              </p>
            )}
          </Field>
        </div>

        {trip.driveType === "self_drive" && (
          <div className="rounded-lg bg-offwhite p-4">
            <p className="text-xs font-medium text-midnight/60">
              Self-drive requires the hirer to be {MIN_SELF_DRIVE_AGE}+ years old with at least{" "}
              {MIN_LICENSE_YEARS} years of driving license experience.
            </p>
            <div className="mt-3 max-w-xs">
              <Field label="Driving license issue date">
                <input
                  required
                  type="date"
                  value={trip.licenseIssueDate}
                  onChange={(e) => update("licenseIssueDate", e.target.value)}
                  className={inputClass}
                />
                {licenseYears !== null && (
                  <p className={`mt-1 text-xs ${licenseOk ? "text-emerald-dark" : "text-red-600"}`}>
                    Experience: {licenseYears} yr(s) {licenseOk ? "✓" : `— must be ${MIN_LICENSE_YEARS}+`}
                  </p>
                )}
              </Field>
            </div>
          </div>
        )}

        {formError && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
    </section>
  );
}
