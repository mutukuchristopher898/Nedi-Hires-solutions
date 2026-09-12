"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PricingDefaults } from "@/lib/supabase/queries";

// Percentages are stored 0-1 and edited as whole numbers — nobody thinks in 0.15.
const FIELDS = [
  { key: "weeklyDiscount", column: "weekly_discount", label: "Weekly discount", unit: "%" },
  { key: "weeklyThresholdDays", column: "weekly_threshold_days", label: "Weekly applies from", unit: "days" },
  { key: "monthlyDiscount", column: "monthly_discount", label: "Monthly discount", unit: "%" },
  { key: "monthlyThresholdDays", column: "monthly_threshold_days", label: "Monthly applies from", unit: "days" },
  { key: "reservationDepositRate", column: "reservation_deposit_rate", label: "Reservation deposit", unit: "%" },
  { key: "securityDepositRate", column: "security_deposit_rate", label: "Security deposit", unit: "%" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

export default function PricingDefaultsEditor({ defaults }: { defaults: PricingDefaults }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldKey, string>>(() => {
    const initial = {} as Record<FieldKey, string>;
    for (const f of FIELDS) {
      initial[f.key] = f.unit === "%" ? String(Math.round(defaults[f.key] * 1000) / 10) : String(defaults[f.key]);
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);

    const patch: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(values[f.key]);
      if (!Number.isFinite(n) || n < 0) {
        setError(`${f.label} must be a number of zero or more.`);
        return;
      }
      if (f.unit === "%" && n >= 100) {
        setError(`${f.label} must be under 100%.`);
        return;
      }
      patch[f.column] = f.unit === "%" ? n / 100 : n;
    }

    // Mirrors the pricing_settings_rates_sane constraint, so the message is
    // ours rather than a raw constraint violation.
    if (patch.monthly_threshold_days < patch.weekly_threshold_days) {
      setError("The monthly threshold must be at least the weekly threshold.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("pricing_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", true);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 className="font-semibold text-midnight">Platform defaults</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Applied to every vehicle that has no override of its own. Changing one here moves every
        vehicle still inheriting it.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[11px] font-medium text-midnight/60">{f.label}</span>
            <div className="mt-1 flex items-center gap-1">
              <input
                inputMode="decimal"
                value={values[f.key]}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }));
                  setSaved(false);
                }}
                aria-label={f.label}
                className="w-full rounded-md border border-line px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
              />
              <span className="text-xs text-midnight/40">{f.unit}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save defaults"}
        </button>
        {saved && <span className="text-xs text-emerald-dark">Saved.</span>}
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
