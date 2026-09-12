"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/data";
import type { PricingDefaults, VehiclePricingRow } from "@/lib/supabase/queries";

// The six overridable rates, in the order they appear on a row. Percentages
// are stored 0-1 and edited as whole numbers, because nobody thinks in 0.15.
const RATE_FIELDS = [
  { key: "weeklyDiscount", column: "weekly_discount", label: "Weekly discount", unit: "%" },
  { key: "weeklyThresholdDays", column: "weekly_threshold_days", label: "from (days)", unit: "d" },
  { key: "monthlyDiscount", column: "monthly_discount", label: "Monthly discount", unit: "%" },
  { key: "monthlyThresholdDays", column: "monthly_threshold_days", label: "from (days)", unit: "d" },
  { key: "reservationDepositRate", column: "reservation_deposit_rate", label: "Reservation deposit", unit: "%" },
  { key: "securityDepositRate", column: "security_deposit_rate", label: "Security deposit", unit: "%" },
] as const;

type RateKey = (typeof RATE_FIELDS)[number]["key"];

function defaultFor(key: RateKey, defaults: PricingDefaults): number {
  return defaults[key];
}

/** Stored 0-1, shown as a percentage; day thresholds pass through. */
function toDisplay(key: RateKey, value: number): string {
  const isPercent = RATE_FIELDS.find((f) => f.key === key)!.unit === "%";
  return isPercent ? String(Math.round(value * 1000) / 10) : String(value);
}

function toStored(key: RateKey, display: string): number {
  const isPercent = RATE_FIELDS.find((f) => f.key === key)!.unit === "%";
  const n = Number(display);
  return isPercent ? n / 100 : n;
}

export default function VehiclePricingEditor({
  vehicles,
  defaults,
}: {
  vehicles: VehiclePricingRow[];
  defaults: PricingDefaults;
}) {
  const [filter, setFilter] = useState("");

  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? vehicles.filter(
        (v) =>
          v.label.toLowerCase().includes(needle) ||
          v.licensePlate.toLowerCase().includes(needle) ||
          (v.partnerName ?? "").toLowerCase().includes(needle)
      )
    : vehicles;

  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <p className="text-sm text-midnight/60">
          No partner vehicles yet. Once a partner lists one, its pricing can be tuned here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block">
        <span className="text-xs font-medium text-midnight/60">Find a vehicle</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Make, model, plate or partner"
          className="mt-1 w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
      </label>

      <p className="mt-3 text-sm text-midnight/60">
        {shown.length} of {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 space-y-3">
        {shown.map((v) => (
          <VehicleRow key={v.id} vehicle={v} defaults={defaults} />
        ))}
      </div>
    </div>
  );
}

function VehicleRow({ vehicle, defaults }: { vehicle: VehiclePricingRow; defaults: PricingDefaults }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<RateKey, string>>(() => {
    const initial = {} as Record<RateKey, string>;
    for (const field of RATE_FIELDS) {
      const override = vehicle.overrides[field.key];
      initial[field.key] = override === null ? "" : toDisplay(field.key, override);
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);

    const patch: Record<string, number | null> = {};
    for (const field of RATE_FIELDS) {
      const raw = values[field.key].trim();
      // Blank means "inherit the platform default", which is a null column —
      // deliberately different from an explicit 0, which means no discount.
      if (raw === "") {
        patch[field.column] = null;
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        setError(`${field.label} must be a number of zero or more, or blank to inherit.`);
        return;
      }
      if (field.unit === "%" && n >= 100) {
        setError(`${field.label} must be under 100%.`);
        return;
      }
      patch[field.column] = toStored(field.key, raw);
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("vehicles").update(patch).eq("id", vehicle.id);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  function resetAllToDefault() {
    const cleared = {} as Record<RateKey, string>;
    for (const field of RATE_FIELDS) cleared[field.key] = "";
    setValues(cleared);
    setSaved(false);
  }

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-semibold text-midnight">{vehicle.label}</h3>
          <p className="text-xs text-midnight/50">
            {vehicle.licensePlate}
            {vehicle.partnerName ? ` · ${vehicle.partnerName}` : ""} ·{" "}
            {formatMoney(vehicle.pricePerDay, vehicle.currency)}/day
            {vehicle.approvalStatus !== "approved" ? ` · ${vehicle.approvalStatus}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={resetAllToDefault}
          className="text-xs font-medium text-midnight/50 underline hover:text-midnight"
        >
          Use platform defaults
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {RATE_FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="text-[11px] font-medium text-midnight/60">{field.label}</span>
            <div className="mt-1 flex items-center gap-1">
              <input
                inputMode="decimal"
                value={values[field.key]}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                  setSaved(false);
                }}
                placeholder={toDisplay(field.key, defaultFor(field.key, defaults))}
                aria-label={`${field.label} for ${vehicle.label}`}
                className="w-full rounded-md border border-line px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
              />
              <span className="text-xs text-midnight/40">{field.unit}</span>
            </div>
          </label>
        ))}
      </div>

      <p className="mt-2 text-xs text-midnight/40">
        Blank inherits the platform default (shown greyed in each box). Zero means none.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-emerald-dark">Saved.</span>}
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
