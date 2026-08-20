import { getSubscriptionPlans } from "@/lib/supabase/queries";
import SubscriptionPlansExplorer from "@/components/subscriptions/SubscriptionPlansExplorer";

export default async function SubscriptionsPage() {
  const subscriptionPlans = await getSubscriptionPlans();

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
            Plans for individual drivers, the diaspora, corporate & hospitality partners,
            and fleet-listing partners — each with the billing cadence that fits.
          </p>
        </div>
      </section>

      <section className="container-shell py-14">
        <SubscriptionPlansExplorer plans={subscriptionPlans} />
      </section>
    </div>
  );
}
