"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/data";
import type { RouteFee } from "@/lib/supabase/queries";

export default function RouteFeeEditor({
  routes,
  defaultFee,
  locations,
}: {
  routes: RouteFee[];
  defaultFee: number;
  locations: string[];
}) {
  return (
    <div className="space-y-8">
      <DefaultFeeRow defaultFee={defaultFee} />
      <KnownRoutes routes={routes} />
      <AddRoute locations={locations} existing={routes} />
    </div>
  );
}

function DefaultFeeRow({ defaultFee }: { defaultFee: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(defaultFee));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    const fee = Number(value);
    if (!(fee >= 0)) {
      setError("Enter a fee of zero or more.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("pricing_settings")
      .update({ default_one_way_fee: fee, updated_at: new Date().toISOString() })
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
      <h2 className="font-semibold text-midnight">Default fee</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Charged for any route not listed below. Partners choose their own pickup locations, so
        new routes appear without warning — this is what they cost until you price them.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-midnight/60">KES</span>
        <input
          type="number"
          min={0}
          step={100}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          aria-label="Default one-way fee in KES"
          className="w-32 rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
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
    </section>
  );
}

function KnownRoutes({ routes }: { routes: RouteFee[] }) {
  return (
    <section>
      <h2 className="font-semibold text-midnight">Priced routes</h2>
      <p className="mt-1 text-sm text-midnight/60">
        A fee applies in both directions — one row covers the journey either way.
      </p>

      {routes.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-6 text-center text-sm text-midnight/60 ring-1 ring-line">
          No routes priced yet. Every one-way hire is charged the default fee.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {routes.map((r) => (
            <RouteRow key={`${r.locationA}|${r.locationB}`} route={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function RouteRow({ route }: { route: RouteFee }) {
  const router = useRouter();
  const [value, setValue] = useState(String(route.fee));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = Number(value) !== route.fee;

  async function save() {
    const fee = Number(value);
    if (!(fee >= 0)) {
      setError("Enter a fee of zero or more.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("one_way_fees")
      .update({ fee, updated_at: new Date().toISOString() })
      .eq("location_a", route.locationA)
      .eq("location_b", route.locationB);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("one_way_fees")
      .delete()
      .eq("location_a", route.locationA)
      .eq("location_b", route.locationB);

    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-midnight">
          {route.locationA} <span className="text-midnight/40">↔</span> {route.locationB}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-midnight/60">KES</span>
          <input
            type="number"
            min={0}
            step={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`Fee for ${route.locationA} to ${route.locationB} in KES`}
            className="w-28 rounded-md border border-line px-3 py-1.5 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={save}
            className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={remove}
            aria-label={`Remove the ${route.locationA} to ${route.locationB} route`}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-midnight/40">Currently {formatMoney(route.fee, "KES")}</p>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AddRoute({ locations, existing }: { locations: string[]; existing: RouteFee[] }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const amount = Number(fee);
    if (!from || !to) {
      setError("Pick both locations.");
      return;
    }
    if (from === to) {
      setError("A route needs two different locations.");
      return;
    }
    if (!(amount >= 0)) {
      setError("Enter a fee of zero or more.");
      return;
    }

    // The table stores pairs in canonical order, enforced by a CHECK
    // constraint, so the row is built that way rather than relying on the
    // order they were picked.
    const [a, b] = [from, to].sort();

    if (existing.some((r) => r.locationA === a && r.locationB === b)) {
      setError("That route is already priced above.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("one_way_fees")
      .insert({ location_a: a, location_b: b, fee: amount });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setFrom("");
    setTo("");
    setFee("");
    router.refresh();
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 className="font-semibold text-midnight">Price another route</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Locations come from vehicles currently listed.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Route from"
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">From…</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Route to"
          className="rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">To…</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step={100}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="KES"
          aria-label="Fee in KES"
          className="w-32 rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <button
          type="button"
          disabled={saving}
          onClick={add}
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
