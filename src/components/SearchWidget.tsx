"use client";

import { useState } from "react";
import { classifications } from "@/lib/data";
import { toNairobiDateInputValue } from "@/lib/duration";

export const SEARCH_LOCATIONS = [
  "Jomo Kenyatta International Airport (JKIA)",
  "Nairobi CBD",
  "Mombasa Moi International Airport",
  "Kisumu",
];

export interface SearchValues {
  location?: string;
  pickup?: string;
  return?: string;
  classification?: string;
  transmission?: string;
}

const todayIso = () => toNairobiDateInputValue(new Date());

function summarise(values: SearchValues) {
  const parts = [
    values.location,
    values.pickup && values.return
      ? `${values.pickup} → ${values.return}`
      : values.pickup || values.return,
    values.classification,
    values.transmission,
  ].filter(Boolean);
  return parts.length ? parts.join("  ·  ") : "All vehicles";
}

export default function SearchWidget({
  initial = {},
  collapsible = false,
}: {
  initial?: SearchValues;
  collapsible?: boolean;
}) {
  // Once a search has run, the form collapses to a one-line summary so the
  // results are what's actually on screen — reopened on demand.
  const [expanded, setExpanded] = useState(!collapsible);
  const [location, setLocation] = useState(initial.location ?? SEARCH_LOCATIONS[0]);
  const [pickup, setPickup] = useState(initial.pickup ?? "");
  const [returnDate, setReturnDate] = useState(initial.return ?? "");
  const [classification, setClassification] = useState(initial.classification ?? "");
  const [transmission, setTransmission] = useState(initial.transmission ?? "");
  const [error, setError] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<{ pickup?: boolean; return?: boolean }>({});

  const today = todayIso();

  function handlePickupChange(value: string) {
    setPickup(value);
    // Keep the pair aligned: a return date earlier than the new pickup date
    // can't stand, so clear it rather than silently submitting a bad range.
    if (returnDate && value && returnDate < value) setReturnDate("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setError(null);
    setDateErrors({});

    const pickupInPast = !!pickup && pickup < today;
    const returnInPast = !!returnDate && returnDate < today;
    const returnBeforePickup = !!pickup && !!returnDate && returnDate < pickup;
    const returnWithoutPickup = !pickup && !!returnDate;

    if (pickupInPast || returnInPast || returnBeforePickup || returnWithoutPickup) {
      e.preventDefault();
      setDateErrors({
        pickup: pickupInPast || returnWithoutPickup,
        return: returnInPast || returnBeforePickup,
      });
      setError(
        pickupInPast || returnInPast
          ? "Those dates are in the past. Please pick today or a later date."
          : returnWithoutPickup
          ? "Please choose a pickup date as well."
          : "The return date can't be before the pickup date."
      );
    }
  }

  const inputClass = "rounded-md border border-line px-3 py-2 text-sm text-midnight focus:border-gold focus:outline-none";
  const dateClass = (invalid?: boolean) =>
    invalid ? `${inputClass} border-red-500 focus:border-red-500` : inputClass;

  if (!expanded) {
    return (
      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
        <p className="text-sm font-medium text-midnight">{summarise(initial)}</p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
        >
          Change search
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      action="/search"
      method="get"
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 lg:p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 lg:col-span-2">
          <span className="text-xs font-medium text-midnight/60">Pickup Location</span>
          <select name="location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass}>
            {SEARCH_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Pickup Date</span>
          <input
            type="date"
            name="pickup"
            min={today}
            value={pickup}
            onChange={(e) => handlePickupChange(e.target.value)}
            className={dateClass(dateErrors.pickup)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Return Date</span>
          <input
            type="date"
            name="return"
            min={pickup || today}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className={dateClass(dateErrors.return)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Vehicle Type</span>
          <select
            name="classification"
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            className={inputClass}
          >
            <option value="">Any type</option>
            {classifications.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Transmission</span>
          <select
            name="transmission"
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            className={inputClass}
          >
            <option value="">Any</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
      </div>

      {error && <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white sm:w-auto"
      >
        Search Vehicles
      </button>
    </form>
  );
}
