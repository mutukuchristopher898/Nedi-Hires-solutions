"use client";

import { useState } from "react";
import type { TripDetails, VehicleListing } from "@/lib/types";
import { calculateAge, calculateYearsSince, MIN_LICENSE_YEARS, MIN_SELF_DRIVE_AGE } from "@/lib/eligibility";
import {
  combineDateAndTime,
  computeDropoff,
  computePricing,
  effectiveDays,
  formatDurationLabel,
  MAX_RENTAL_DAYS,
  oneWayFee,
  toNairobiDateInputValue,
  toNairobiTimeInputValue,
  type DurationUnit,
} from "@/lib/duration";
import { formatMoney } from "@/lib/data";
import { Field, fieldProps, FormError, inputClass } from "./shared";
import type { OneWayFeeTable } from "@/lib/duration";

export const PICKUP_POINTS = [
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

const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

// Nairobi's calendar date, not the browser's — a customer booking from
// abroad shouldn't see a different "today" than the business does.
const todayIso = () => toNairobiDateInputValue(new Date());

export default function TripDetailsStep({
  vehicle,
  value: trip,
  feeTable,
  onChange,
  saving,
  onSubmit,
}: {
  vehicle: VehicleListing;
  feeTable: OneWayFeeTable;
  value: TripDetails;
  onChange: (patch: Partial<TripDetails>) => void;
  saving: boolean;
  onSubmit: (trip: TripDetails) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    pickupDate?: boolean;
    pickupPoint?: boolean;
    destination?: boolean;
    dropoff?: boolean;
    dropoffPoint?: boolean;
    dateOfBirth?: boolean;
    licenseIssueDate?: boolean;
  }>({});

  const pickupAt = combineDateAndTime(trip.pickupDate, trip.pickupTime);
  const dropoffAt = combineDateAndTime(trip.dropoffDate, trip.dropoffTime);
  const days = effectiveDays(pickupAt, dropoffAt);
  const pricing = computePricing(vehicle.pricePerDay, days, vehicle.rates);
  const fee = trip.returnToDifferentLocation ? oneWayFee(trip.pickupPoint, trip.dropoffPoint, feeTable) : 0;

  function update<K extends keyof TripDetails>(key: K, value: TripDetails[K]) {
    onChange({ [key]: value } as Partial<TripDetails>);
  }

  // Duration control and pickup date/time drive drop-off by default — this
  // is the "primary" direction of the two-way binding. Editing drop-off
  // directly (below) is treated as an override that only affects pricing
  // (via effectiveDays, always computed live) and leaves duration
  // unit/quantity as stale display values, which is fine since they're
  // never read again for pricing once drop-off has been hand-edited.
  function recomputeDropoff(nextPickupDate: string, nextPickupTime: string, unit: DurationUnit, quantity: number) {
    const nextPickupAt = combineDateAndTime(nextPickupDate, nextPickupTime);
    const nextDropoffAt = computeDropoff(nextPickupAt, unit, quantity);
    return {
      dropoffDate: toNairobiDateInputValue(nextDropoffAt),
      dropoffTime: toNairobiTimeInputValue(nextDropoffAt),
    };
  }

  function handlePickupDateChange(value: string) {
    const { dropoffDate, dropoffTime } = recomputeDropoff(value, trip.pickupTime, trip.durationUnit, trip.durationQuantity);
    onChange({ pickupDate: value, dropoffDate, dropoffTime });
  }

  function handlePickupTimeChange(value: string) {
    const { dropoffDate, dropoffTime } = recomputeDropoff(trip.pickupDate, value, trip.durationUnit, trip.durationQuantity);
    onChange({ pickupTime: value, dropoffDate, dropoffTime });
  }

  function handleDurationUnitChange(unit: DurationUnit) {
    const { dropoffDate, dropoffTime } = recomputeDropoff(trip.pickupDate, trip.pickupTime, unit, trip.durationQuantity);
    onChange({ durationUnit: unit, dropoffDate, dropoffTime });
  }

  function handleDurationQuantityChange(quantity: number) {
    const safeQuantity = Math.max(1, quantity || 1);
    const { dropoffDate, dropoffTime } = recomputeDropoff(trip.pickupDate, trip.pickupTime, trip.durationUnit, safeQuantity);
    onChange({ durationQuantity: safeQuantity, dropoffDate, dropoffTime });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const today = todayIso();
    const missingPickupDate = !trip.pickupDate.trim();
    const missingPickupPoint = !trip.pickupPoint.trim();
    const missingDestination = !trip.destination.trim();
    // The form runs noValidate, so the inputs' own `min`/`max` attributes
    // don't block submission — every date rule has to be checked here too.
    const pickupInPast = !missingPickupDate && trip.pickupDate < today;
    const dropoffInvalid = dropoffAt.getTime() <= pickupAt.getTime();
    const tooLong = days > MAX_RENTAL_DAYS;
    const missingDropoffPoint = trip.returnToDifferentLocation && !trip.dropoffPoint.trim();

    if (
      missingPickupDate ||
      pickupInPast ||
      missingPickupPoint ||
      missingDestination ||
      dropoffInvalid ||
      tooLong ||
      missingDropoffPoint
    ) {
      setFieldErrors({
        pickupDate: missingPickupDate || pickupInPast,
        pickupPoint: missingPickupPoint,
        destination: missingDestination,
        dropoff: dropoffInvalid || tooLong,
        dropoffPoint: missingDropoffPoint,
      });
      setFormError(
        pickupInPast
          ? "The pickup date can't be in the past. Please choose today or a later date."
          : tooLong
          ? `The maximum rental period is ${MAX_RENTAL_DAYS} days. Please shorten your drop-off date.`
          : dropoffInvalid
          ? "The drop-off must be after the pickup. Please check your dates."
          : "Please fix the highlighted fields below."
      );
      return;
    }

    if (trip.driveType === "self_drive") {
      const futureDob = !!trip.dateOfBirth && trip.dateOfBirth > today;
      const futureLicense = !!trip.licenseIssueDate && trip.licenseIssueDate > today;

      if (futureDob || futureLicense) {
        setFieldErrors({ dateOfBirth: futureDob, licenseIssueDate: futureLicense });
        setFormError("Please check your dates — they can't be in the future.");
        return;
      }

      const eligible =
        calculateAge(trip.dateOfBirth) >= MIN_SELF_DRIVE_AGE &&
        calculateYearsSince(trip.licenseIssueDate) >= MIN_LICENSE_YEARS;

      if (!eligible) {
        setFieldErrors({ dateOfBirth: true, licenseIssueDate: true });
        setFormError(
          "This booking doesn't meet our self-drive eligibility requirements. Please choose chauffeur-driven, or contact support for assistance."
        );
        return;
      }
    }

    setFieldErrors({});
    onSubmit({ ...trip, dropoffPoint: trip.returnToDifferentLocation ? trip.dropoffPoint : trip.pickupPoint });
  }

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">1. Trip Details</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Tell us about your trip with the {vehicle.make} {vehicle.model}.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup date">
            <input
              required
              type="date"
              min={todayIso()}
              value={trip.pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
              {...fieldProps(fieldErrors.pickupDate ? "reject" : undefined)}
            />
          </Field>
          <Field label="Pickup time">
            <input
              required
              type="time"
              step={900}
              value={trip.pickupTime}
              onChange={(e) => handlePickupTimeChange(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Pickup point">
            <select
              required
              value={trip.pickupPoint}
              onChange={(e) => update("pickupPoint", e.target.value)}
              {...fieldProps(fieldErrors.pickupPoint ? "reject" : undefined)}
            >
              <option value="" disabled>
                Select a pickup point
              </option>
              {PICKUP_POINTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destination">
            <select
              required
              value={trip.destination}
              onChange={(e) => update("destination", e.target.value)}
              {...fieldProps(fieldErrors.destination ? "reject" : undefined)}
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

        <div className="rounded-lg bg-offwhite p-4">
          <p id="duration-label" className="text-xs font-medium text-midnight/60">Rental duration</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Toggle buttons rather than a radiogroup: aria-pressed describes
                what these actually do, and claiming radio semantics would
                promise arrow-key navigation the group doesn't implement. */}
            <div role="group" aria-labelledby="duration-label" className="flex flex-wrap gap-2">
              {DURATION_UNITS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  aria-pressed={trip.durationUnit === u.value}
                  onClick={() => handleDurationUnitChange(u.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    trip.durationUnit === u.value
                      ? "bg-gold text-midnight"
                      : "bg-white text-midnight/60 ring-1 ring-line hover:bg-midnight/5"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              aria-label={`Number of ${trip.durationUnit}`}
              value={trip.durationQuantity}
              onChange={(e) => handleDurationQuantityChange(Number(e.target.value))}
              className="w-20 rounded-md border border-line px-3 py-1.5 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          {/* The red ring sits on the container because the problem is the pair
              of values, not either one alone — but the ring alone is invisible
              to assistive tech, so both inputs report invalid too. */}
          <div className={`mt-4 grid gap-4 sm:grid-cols-2 ${fieldErrors.dropoff ? "rounded-md ring-1 ring-red-500" : ""}`}>
            <Field label="Drop-off date">
              <input
                required
                type="date"
                min={trip.pickupDate || todayIso()}
                value={trip.dropoffDate}
                onChange={(e) => update("dropoffDate", e.target.value)}
                aria-invalid={fieldErrors.dropoff ? true : undefined}
                className={inputClass}
              />
            </Field>
            <Field label="Drop-off time">
              <input
                required
                type="time"
                step={900}
                value={trip.dropoffTime}
                onChange={(e) => update("dropoffTime", e.target.value)}
                aria-invalid={fieldErrors.dropoff ? true : undefined}
                className={inputClass}
              />
            </Field>
          </div>

          <p className="mt-3 text-sm text-midnight/70">
            {formatDurationLabel(trip.durationUnit, trip.durationQuantity)} selected — billed as {days} day
            {days === 1 ? "" : "s"}
            {pricing.rateLabel && (
              <>
                {" "}
                · <span className="font-medium text-emerald-dark">{pricing.rateLabel}</span> — you save{" "}
                {formatMoney(pricing.savingsAmount, vehicle.currency)}
              </>
            )}
          </p>
        </div>

        <div className="rounded-lg bg-offwhite p-4">
          <label className="flex items-center gap-2 text-sm text-midnight/80">
            <input
              type="checkbox"
              checked={trip.returnToDifferentLocation}
              onChange={(e) => update("returnToDifferentLocation", e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            Return to a different location
          </label>

          {trip.returnToDifferentLocation && (
            <div className="mt-3">
              <Field label="Drop-off point">
                <select
                  required
                  value={trip.dropoffPoint}
                  onChange={(e) => update("dropoffPoint", e.target.value)}
                  {...fieldProps(fieldErrors.dropoffPoint ? "reject" : undefined)}
                >
                  <option value="" disabled>
                    Select a drop-off point
                  </option>
                  {PICKUP_POINTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              {fee > 0 && (
                <p className="mt-2 text-sm text-midnight/70">
                  One-way fee: {formatMoney(fee, vehicle.currency)}
                </p>
              )}
            </div>
          )}
        </div>

        {trip.driveType === "self_drive" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your date of birth">
              <input
                required
                type="date"
                max={todayIso()}
                value={trip.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                {...fieldProps(fieldErrors.dateOfBirth ? "reject" : undefined)}
              />
            </Field>
            <Field label="Driving license issue date">
              <input
                required
                type="date"
                max={todayIso()}
                value={trip.licenseIssueDate}
                onChange={(e) => update("licenseIssueDate", e.target.value)}
                {...fieldProps(fieldErrors.licenseIssueDate ? "reject" : undefined)}
              />
            </Field>
          </div>
        )}

        {formError && (
          <FormError message={formError} details={fieldErrors} />
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
