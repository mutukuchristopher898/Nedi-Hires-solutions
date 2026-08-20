import { createClient } from "./server";
import type { QuoteRequest, SubscriptionAudience, SubscriptionPlan, VehicleClassification } from "@/lib/types";

interface SubscriptionPlanRow {
  id: string;
  name: string;
  audience: SubscriptionAudience;
  monthly_price: number | null;
  quarterly_price: number | null;
  annual_price: number | null;
  currency: "USD" | "KES";
  tier_classes: VehicleClassification[];
  swaps_per_month: number;
  vehicle_count_max: number | null;
  highlight: boolean;
  perks: string[];
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, name, audience, monthly_price, quarterly_price, annual_price, currency, tier_classes, swaps_per_month, vehicle_count_max, highlight, perks"
    )
    .order("audience", { ascending: true })
    .order("monthly_price", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Failed to load subscription plans: ${error.message}`);

  return (data as SubscriptionPlanRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    audience: row.audience,
    monthlyPrice: row.monthly_price ?? undefined,
    quarterlyPrice: row.quarterly_price ?? undefined,
    annualPrice: row.annual_price ?? undefined,
    currency: row.currency,
    tierClass: row.tier_classes,
    swapsPerMonth: row.swaps_per_month,
    vehicleCountMax: row.vehicle_count_max ?? undefined,
    highlight: row.highlight,
    perks: row.perks,
  }));
}

interface QuoteRequestRow {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  vehicle_count: number;
  vehicle_types: string | null;
  notes: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, business_name, contact_email, contact_phone, vehicle_count, vehicle_types, notes, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load quote requests: ${error.message}`);

  return (data as QuoteRequestRow[]).map((row) => ({
    id: row.id,
    businessName: row.business_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    vehicleCount: row.vehicle_count,
    vehicleTypes: row.vehicle_types,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  }));
}

// Resolves the real DB row backing a displayed (mock/demo) vehicle, keyed by
// the stable slug used in URLs, so bookings can reference a real vehicle_id.
export async function getVehicleDbIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id")
    .eq("slug", slug)
    .eq("approval_status", "approved")
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}
