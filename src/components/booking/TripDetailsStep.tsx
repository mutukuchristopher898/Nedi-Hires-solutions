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

// Destination is restricted to Kenya for now — the business only operates
// within the country at this stage.
const KENYA_DESTINATIONS = [
  "Nairobi",
  "Mombasa",
  "Nakuru",
  "Eldoret",
  "Kisumu",
  "Naivasha",
  "Nanyuki",
  "Machakos",
  "Meru",
  "Nyeri",
  "Kisii",
  "Kericho",
  "Kitale",
  "Malindi",
  "Diani Beach",
  "Watamu",
  "Lamu",
  "Voi",
  "Narok",
  "Garissa",
  "Maasai Mara National Reserve",
  "Amboseli National Park",
  "Tsavo East National Park",
  "Tsavo West National Park",
  "Lake Nakuru National Park",
  "Hell's Gate National Park",
  "Mount Kenya",
  "Samburu National Reserve",
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

  function update<K extends keyof TripDetails>(key: K, value: TripDetails[K]) {
    setTrip((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (trip.driveType === "self_drive") {
      const eligible =
        calculateAge(trip.dateOfBirth) >= MIN_SELF_DRIVE_AGE &&
        calculateYearsSince(trip.licenseIssueDate) >= MIN_LICENSE_YEARS;

      if (!eligible) {
        setFormError(
          "This booking doesn't meet our self-drive eligibility requirements. Please choose chauffeur-driven, or contact support for assistance."
        );
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
            <select
              required
              value={trip.destination}
              onChange={(e) => update("destination", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a destination
              </option>
              {KENYA_DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
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
        </div>

        {trip.driveType === "self_drive" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your date of birth">
              <input
                required
                type="date"
                value={trip.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Driving license issue date">
              <input
                required
                type="date"
                value={trip.licenseIssueDate}
                onChange={(e) => update("licenseIssueDate", e.target.value)}
                className={inputClass}
              />
            </Field>
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
