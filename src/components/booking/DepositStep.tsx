"use client";

import { formatMoney } from "@/lib/data";
import { Row } from "./shared";

export default function DepositStep({
  deposit,
  total,
  days,
  pricePerDay,
  currency,
  saving,
  onSubmit,
}: {
  deposit: number;
  total: number;
  days: number;
  pricePerDay: number;
  currency: string;
  saving: boolean;
  onSubmit: () => void;
}) {
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">5. Reservation & Deposit</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Pay a reservation deposit to temporarily hold this vehicle.
      </p>

      <div className="mt-5 rounded-lg bg-offwhite p-4 text-sm">
        <Row label={`${formatMoney(pricePerDay, currency)} × ${days} day(s)`} value={money(total)} />
        <Row label="Reservation deposit due now" value={money(deposit)} bold />
      </div>

      <button
        onClick={onSubmit}
        disabled={saving}
        className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white disabled:opacity-60 sm:w-auto"
      >
        {saving ? "Processing…" : `Pay Deposit — ${money(deposit)}`}
      </button>
    </section>
  );
}
