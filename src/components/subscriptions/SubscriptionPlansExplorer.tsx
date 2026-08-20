"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubscriptionAudience, SubscriptionPlan } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import DemoTag from "@/components/DemoTag";

type Cycle = "monthly" | "quarterly" | "annual";

const AUDIENCE_TABS: { key: SubscriptionAudience; label: string }[] = [
  { key: "individual", label: "Individual" },
  { key: "diaspora", label: "Diaspora" },
  { key: "corporate", label: "Corporate & Hospitality" },
  { key: "partner", label: "Partners" },
];

const CYCLE_SUFFIX: Record<Cycle, string> = { monthly: "/month", quarterly: "/quarter", annual: "/year" };
const CYCLE_LABEL: Record<Cycle, string> = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };

function priceFor(plan: SubscriptionPlan, cycle: Cycle): number | undefined {
  if (cycle === "monthly") return plan.monthlyPrice;
  if (cycle === "quarterly") return plan.quarterlyPrice;
  return plan.annualPrice;
}

function firstAvailableCycle(plan: SubscriptionPlan): Cycle {
  if (plan.monthlyPrice !== undefined) return "monthly";
  if (plan.quarterlyPrice !== undefined) return "quarterly";
  return "annual";
}

export default function SubscriptionPlansExplorer({ plans }: { plans: SubscriptionPlan[] }) {
  const [audience, setAudience] = useState<SubscriptionAudience>("individual");
  const [selectedCycle, setSelectedCycle] = useState<Cycle>("monthly");

  const groups = AUDIENCE_TABS.map((t) => ({ ...t, plans: plans.filter((p) => p.audience === t.key) }));
  const activeGroup = groups.find((g) => g.key === audience) ?? groups[0];

  const availableCycles: Cycle[] = (["monthly", "quarterly", "annual"] as Cycle[]).filter((c) =>
    activeGroup.plans.some((p) => priceFor(p, c) !== undefined)
  );
  const effectiveCycle = availableCycles.includes(selectedCycle) ? selectedCycle : availableCycles[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g.key}
            onClick={() => setAudience(g.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              audience === g.key
                ? "bg-midnight text-white"
                : "bg-white text-midnight/70 ring-1 ring-line hover:bg-midnight/5"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {availableCycles.length > 1 && (
        <div className="mt-5 inline-flex rounded-full bg-white p-1 ring-1 ring-line">
          {availableCycles.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCycle(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                effectiveCycle === c ? "bg-gold text-midnight" : "text-midnight/60 hover:text-midnight"
              }`}
            >
              {CYCLE_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {activeGroup.plans.map((plan) => {
          const planCycle = priceFor(plan, effectiveCycle) !== undefined ? effectiveCycle : firstAvailableCycle(plan);
          const price = priceFor(plan, planCycle);

          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl p-6 ring-1 ${
                plan.highlight ? "bg-midnight text-white ring-midnight" : "bg-white text-midnight ring-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {plan.highlight && (
                  <span className="inline-flex w-fit rounded-full bg-gold px-3 py-1 text-xs font-semibold text-midnight">
                    Most Popular
                  </span>
                )}
                {plan.audience !== "individual" && <DemoTag label="Indicative Pricing" />}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{price !== undefined ? formatMoney(price, plan.currency) : "—"}</span>
                <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-midnight/60"}`}>
                  {CYCLE_SUFFIX[planCycle]}
                </span>
              </div>
              {planCycle !== effectiveCycle && (
                <p className={`mt-1 text-xs ${plan.highlight ? "text-white/50" : "text-midnight/50"}`}>
                  {CYCLE_LABEL[planCycle]} billing only
                </p>
              )}
              <p className={`mt-1 text-sm ${plan.highlight ? "text-white/60" : "text-midnight/60"}`}>
                {plan.tierClass.length > 0 ? `${plan.tierClass.join(" · ")} tier(s) · ` : ""}
                {plan.swapsPerMonth > 0 ? `${plan.swapsPerMonth} swap(s)/month` : ""}
                {plan.vehicleCountMax ? `Up to ${plan.vehicleCountMax} vehicles listed` : ""}
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <span className={plan.highlight ? "text-emerald" : "text-emerald-dark"}>✓</span>
                    <span className={plan.highlight ? "text-white/80" : "text-midnight/70"}>{perk}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 rounded-md px-5 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gold text-midnight hover:bg-gold-dark hover:text-white"
                    : "bg-midnight text-white hover:bg-charcoal"
                }`}
              >
                Choose {plan.name}
              </button>
            </div>
          );
        })}
      </div>

      {audience === "partner" && (
        <div className="mt-6 rounded-2xl bg-emerald/5 p-6 ring-1 ring-emerald/20">
          <h3 className="font-semibold text-midnight">Listing more vehicles?</h3>
          <p className="mt-1 text-sm text-midnight/60">
            Larger fleets get a custom quote tailored to how many vehicles you&apos;re listing.
          </p>
          <Link
            href="/partners/quote"
            className="mt-4 inline-block rounded-md bg-emerald px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-dark"
          >
            Request a Custom Quote
          </Link>
        </div>
      )}
    </div>
  );
}
