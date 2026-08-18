import { formatMoney, subscriptionPlans } from "@/lib/data";

export default function SubscriptionsPage() {
  return (
    <div>
      <section className="bg-midnight py-16 text-white">
        <div className="container-shell">
          <p className="text-xs font-medium uppercase tracking-wide text-gold">
            Mobility Subscriptions
          </p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">
            Vehicle access, without the ownership liabilities.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/70">
            All-inclusive monthly plans granting power-users regular, tiered access to
            vehicles across our fleet — ideal for the returning diaspora and long-stay
            residents.
          </p>
        </div>
      </section>

      <section className="container-shell py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl p-6 ring-1 ${
                plan.highlight
                  ? "bg-midnight text-white ring-midnight"
                  : "bg-white text-midnight ring-line"
              }`}
            >
              {plan.highlight && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-gold px-3 py-1 text-xs font-semibold text-midnight">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{formatMoney(plan.monthlyPrice, plan.currency)}</span>
                <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-midnight/60"}`}>
                  /month
                </span>
              </div>
              <p className={`mt-1 text-sm ${plan.highlight ? "text-white/60" : "text-midnight/60"}`}>
                {plan.tierClass.join(" · ")} tier(s) · {plan.swapsPerMonth} swap(s)/month
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
          ))}
        </div>
      </section>
    </div>
  );
}
