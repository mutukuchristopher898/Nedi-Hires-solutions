"use client";

import { formatMoney } from "@/lib/data";
import { Row } from "./shared";

export default function SettlementStep({
  remaining,
  securityDeposit,
  currency,
  onSubmit,
}: {
  remaining: number;
  securityDeposit: number;
  currency: string;
  onSubmit: () => void;
}) {
  const money = (amount: number) => formatMoney(amount, currency);

  return (
    <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
      <h2 className="text-lg font-semibold text-midnight">7. Final Settlement</h2>
      <p className="mt-1 text-sm text-midnight/60">
        Your identity is verified. Settle the remaining rental amount and security deposit
        online or at the physical vehicle handoff.
      </p>

      <div className="mt-5 rounded-lg bg-offwhite p-4 text-sm">
        <Row label="Remaining rental balance" value={money(remaining)} />
        <Row label="Security deposit (refundable)" value={money(securityDeposit)} />
        <Row label="Total due" value={money(remaining + securityDeposit)} bold />
      </div>

      <button
        onClick={onSubmit}
        className="mt-6 w-full rounded-md bg-gold px-5 py-3 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white sm:w-auto"
      >
        Complete Payment
      </button>
    </section>
  );
}
