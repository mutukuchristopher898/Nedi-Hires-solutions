import { createClient } from "./server";
import type { SubscriptionPlan, VehicleClassification } from "@/lib/types";

interface SubscriptionPlanRow {
  id: string;
  name: string;
  monthly_price: number;
  currency: "USD" | "KES";
  tier_classes: VehicleClassification[];
  swaps_per_month: number;
  highlight: boolean;
  perks: string[];
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id, name, monthly_price, currency, tier_classes, swaps_per_month, highlight, perks")
    .order("monthly_price", { ascending: true });

  if (error) throw new Error(`Failed to load subscription plans: ${error.message}`);

  return (data as SubscriptionPlanRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    monthlyPrice: row.monthly_price,
    currency: row.currency,
    tierClass: row.tier_classes,
    swapsPerMonth: row.swaps_per_month,
    highlight: row.highlight,
    perks: row.perks,
  }));
}
