import { createClient } from "./server";
import { oneWayFeeKey, type OneWayFeeTable } from "@/lib/duration";
import type {
  AdminBooking,
  ApprovalStatus,
  BookingStatus,
  FuelType,
  PartnerAccount,
  PartnerVehicle,
  PricingRates,
  Transmission,
  VehicleFilters,
  VehicleListing,
  ContactMessage,
  PendingDocument,
  QuoteRequest,
  SubscriptionAudience,
  SubscriptionPlan,
  VehicleClassification,
} from "@/lib/types";

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


interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactMessage["status"];
  created_at: string;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load contact messages: ${error.message}`);

  return (data as ContactMessageRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }));
}

interface IdentityDocumentRow {
  id: string;
  doc_type: string;
  file_url: string;
  status: ApprovalStatus;
  submitted_at: string;
  bookings: { booking_ref: string } | null;
  profiles: { full_name: string | null } | null;
}

// The real verification queue. Reading the customer's name depends on the
// admin SELECT policy on profiles added in 20260904090000 — without it the
// join silently returns null for every row.
export async function getPendingDocuments(): Promise<PendingDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("identity_documents")
    .select(
      "id, doc_type, file_url, status, submitted_at, bookings(booking_ref), profiles(full_name)"
    )
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to load identity documents: ${error.message}`);

  return (data as unknown as IdentityDocumentRow[]).map((row) => ({
    id: row.id,
    customerName: row.profiles?.full_name ?? null,
    bookingRef: row.bookings?.booking_ref ?? null,
    docType: row.doc_type,
    fileUrl: row.file_url,
    status: row.status,
    submittedAt: row.submitted_at,
  }));
}

interface AdminBookingRow {
  id: string;
  booking_ref: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  vehicles: { make: string; model: string; year: number; license_plate: string } | null;
}

// Admin-only: "Admins can view all bookings" (20260818120000) is what widens
// this past the caller's own rows.
export async function getAdminBookings(): Promise<AdminBooking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_ref, status, start_date, end_date, total_amount, currency, created_at, profiles(full_name), vehicles(make, model, year, license_plate)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load bookings: ${error.message}`);

  const today = new Date().toISOString().slice(0, 10);

  return (data as unknown as AdminBookingRow[]).map((row) => ({
    id: row.id,
    bookingRef: row.booking_ref,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmount: row.total_amount,
    currency: row.currency,
    createdAt: row.created_at,
    customerName: row.profiles?.full_name ?? null,
    vehicleLabel: row.vehicles ? `${row.vehicles.make} ${row.vehicles.model} ${row.vehicles.year}` : "Unknown vehicle",
    licensePlate: row.vehicles?.license_plate ?? "—",
    // Mirrors enforce_vehicle_availability (20260911120000): anything not
    // cancelled, whose dates haven't passed, is still withholding the car.
    // The 30-minute grace on unconfirmed bookings isn't reflected here — this
    // flag is for spotting what to release, and a booking inside its grace
    // window is about to stop holding anyway.
    holdsVehicle: row.status !== "cancelled" && row.end_date >= today,
  }));
}

interface VehicleRow {
  id: string;
  slug: string | null;
  make: string;
  model: string;
  year: number;
  classification: VehicleClassification;
  fuel_type: FuelType;
  transmission: Transmission;
  capacity: number;
  license_plate: string;
  location: string;
  price_per_day: number;
  currency: string;
  description: string;
  features: string[];
  photo_paths: string[] | null;
  approval_status: ApprovalStatus;
  created_at: string;
  partner_id: string | null;
  partners?: { business_name: string } | null;
}

const VEHICLE_COLUMNS =
  "id, slug, make, model, year, classification, fuel_type, transmission, capacity, license_plate, location, price_per_day, currency, description, features, photo_paths, approval_status, created_at, partner_id";

function toPartnerVehicle(row: VehicleRow): PartnerVehicle {
  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    year: row.year,
    classification: row.classification,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    capacity: row.capacity,
    licensePlate: row.license_plate,
    location: row.location,
    pricePerDay: row.price_per_day,
    currency: row.currency,
    description: row.description,
    features: row.features ?? [],
    photoPaths: row.photo_paths ?? [],
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
    partnerId: row.partner_id,
    partnerName: row.partners?.business_name ?? null,
  };
}

/** The signed-in user's own partner account, or null if they don't have one. */
export async function getMyPartnerAccount(): Promise<PartnerAccount | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("id, business_name, business_email, status, created_at")
    .maybeSingle();

  if (error) throw new Error(`Failed to load partner account: ${error.message}`);
  if (!data) return null;

  const row = data as { id: string; business_name: string; business_email: string | null; status: ApprovalStatus; created_at: string };
  return {
    id: row.id,
    businessName: row.business_name,
    businessEmail: row.business_email,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * The signed-in partner's own vehicles, at any approval status.
 * "Partners can view their own vehicles regardless of status" is what returns
 * the pending and rejected ones.
 */
export async function getMyPartnerVehicles(partnerId: string): Promise<PartnerVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load your vehicles: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(toPartnerVehicle);
}

/** Admin queue: every vehicle awaiting a decision, newest last so the oldest is dealt with first. */
export async function getVehiclesAwaitingApproval(): Promise<PartnerVehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(`${VEHICLE_COLUMNS}, partners(business_name)`)
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load the approval queue: ${error.message}`);
  return (data as unknown as VehicleRow[]).map(toPartnerVehicle);
}

export interface FleetCounts {
  /** Real partner-supplied inventory, excluding the illustrative demo rows. */
  liveVehicles: number;
  pendingVehicles: number;
  rejectedVehicles: number;
  pendingPartners: number;
  /** Illustrative rows still in the table, counted separately so they never
      inflate a figure an operator might act on. */
  demoVehicles: number;
}

export async function getFleetCounts(): Promise<FleetCounts> {
  const supabase = await createClient();

  // head: true returns the count without transferring any rows.
  async function countVehicles(isDemo: boolean, approvalStatus?: ApprovalStatus) {
    let query = supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", isDemo);

    if (approvalStatus) query = query.eq("approval_status", approvalStatus);

    const { count, error } = await query;
    if (error) throw new Error(`Failed to count vehicles: ${error.message}`);
    return count ?? 0;
  }

  async function countPendingPartners() {
    const { count, error } = await supabase
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    if (error) throw new Error(`Failed to count partners: ${error.message}`);
    return count ?? 0;
  }

  const [liveVehicles, pendingVehicles, rejectedVehicles, demoVehicles, pendingPartners] =
    await Promise.all([
      countVehicles(false, "approved"),
      countVehicles(false, "pending"),
      countVehicles(false, "rejected"),
      countVehicles(true),
      countPendingPartners(),
    ]);

  return { liveVehicles, pendingVehicles, rejectedVehicles, demoVehicles, pendingPartners };
}

const LISTING_COLUMNS =
  "id, slug, make, model, year, classification, fuel_type, transmission, capacity, location, price_per_day, currency, description, features, photo_paths, image_key, partner_name, is_demo, weekly_threshold_days, weekly_discount, monthly_threshold_days, monthly_discount, reservation_deposit_rate, security_deposit_rate, partners(business_name)";

interface ListingRow {
  id: string;
  slug: string | null;
  make: string;
  model: string;
  year: number;
  classification: VehicleClassification;
  fuel_type: FuelType;
  transmission: Transmission;
  capacity: number;
  location: string;
  price_per_day: number;
  currency: string;
  description: string;
  features: string[] | null;
  photo_paths: string[] | null;
  image_key: string;
  partner_name: string | null;
  is_demo: boolean;
  weekly_threshold_days: number | null;
  weekly_discount: number | null;
  monthly_threshold_days: number | null;
  monthly_discount: number | null;
  reservation_deposit_rate: number | null;
  security_deposit_rate: number | null;
  partners?: { business_name: string } | null;
}

interface PricingDefaultsRow {
  weekly_threshold_days: number;
  weekly_discount: number;
  monthly_threshold_days: number;
  monthly_discount: number;
  reservation_deposit_rate: number;
  security_deposit_rate: number;
}

const PRICING_DEFAULT_COLUMNS =
  "weekly_threshold_days, weekly_discount, monthly_threshold_days, monthly_discount, reservation_deposit_rate, security_deposit_rate";

/**
 * The platform defaults. A vehicle stores only what differs from these, so
 * every listing needs them to resolve its own rates — mirroring the coalesce
 * in enforce_booking_money, which stays authoritative.
 */
async function loadPricingDefaults(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<PricingDefaultsRow> {
  const { data, error } = await supabase
    .from("pricing_settings")
    .select(PRICING_DEFAULT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to load pricing settings: ${error.message}`);
  if (!data) throw new Error("Pricing settings row is missing");

  return data as PricingDefaultsRow;
}

function resolveRates(row: ListingRow, defaults: PricingDefaultsRow): PricingRates {
  return {
    weeklyThresholdDays: Number(row.weekly_threshold_days ?? defaults.weekly_threshold_days),
    weeklyDiscount: Number(row.weekly_discount ?? defaults.weekly_discount),
    monthlyThresholdDays: Number(row.monthly_threshold_days ?? defaults.monthly_threshold_days),
    monthlyDiscount: Number(row.monthly_discount ?? defaults.monthly_discount),
    reservationDepositRate: Number(row.reservation_deposit_rate ?? defaults.reservation_deposit_rate),
    securityDepositRate: Number(row.security_deposit_rate ?? defaults.security_deposit_rate),
  };
}

function toListing(row: ListingRow, defaults: PricingDefaultsRow): VehicleListing {
  return {
    id: row.id,
    // Slug is the public URL. Every row has one: hand-written for the seeded
    // fleet, minted by trigger for anything a partner submits.
    slug: row.slug ?? row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    classification: row.classification,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    capacity: row.capacity,
    location: row.location,
    pricePerDay: row.price_per_day,
    currency: row.currency,
    description: row.description,
    features: row.features ?? [],
    photoPaths: row.photo_paths ?? [],
    imageKey: row.image_key,
    // partners.business_name is the real link; partner_name is the flat text
    // the seeded rows carry, since they have no partner record.
    partnerName: row.partners?.business_name ?? row.partner_name,
    isDemo: row.is_demo,
    rates: resolveRates(row, defaults),
  };
}

/**
 * Approved vehicles, for search. Relies on "Approved vehicles are publicly
 * viewable", so this works for signed-out visitors.
 */
export async function getApprovedVehicles(filters: VehicleFilters = {}): Promise<VehicleListing[]> {
  const supabase = await createClient();

  let query = supabase
    .from("vehicles")
    .select(LISTING_COLUMNS)
    .eq("approval_status", "approved");

  // Filtering in the database rather than in JS: the fleet is meant to grow
  // past the point where fetching all of it per search is reasonable.
  if (filters.location) query = query.eq("location", filters.location);
  if (filters.classification) query = query.eq("classification", filters.classification);
  if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType);
  if (filters.transmission) query = query.eq("transmission", filters.transmission);

  const [{ data, error }, defaults] = await Promise.all([
    query.order("price_per_day", { ascending: true }),
    loadPricingDefaults(supabase),
  ]);

  if (error) throw new Error(`Failed to load vehicles: ${error.message}`);
  return (data as unknown as ListingRow[]).map((row) => toListing(row, defaults));
}

/** One approved vehicle by its public slug, or null. */
export async function getApprovedVehicleBySlug(slug: string): Promise<VehicleListing | null> {
  const supabase = await createClient();
  const [{ data, error }, defaults] = await Promise.all([
    supabase
      .from("vehicles")
      .select(LISTING_COLUMNS)
      .eq("slug", slug)
      .eq("approval_status", "approved")
      .maybeSingle(),
    loadPricingDefaults(supabase),
  ]);

  if (error) throw new Error(`Failed to load vehicle: ${error.message}`);
  return data ? toListing(data as unknown as ListingRow, defaults) : null;
}

/** The distinct pickup points that currently have an approved vehicle. */
export async function getVehicleLocations(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("location")
    .eq("approval_status", "approved");

  if (error) throw new Error(`Failed to load locations: ${error.message}`);

  const seen = new Set((data as { location: string }[]).map((r) => r.location));
  return [...seen].sort();
}

export interface PublicFleetStats {
  vehicles: number;
  operators: number;
  locations: number;
}

/**
 * Figures for the public marketing pages, counted from live inventory.
 *
 * Deliberately not "trips completed" or "average rating": there is no reviews
 * feature, and a trip count is either fabricated or too small to advertise.
 * These three are honest at any scale and grow on their own.
 */
export async function getPublicFleetStats(): Promise<PublicFleetStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("location, partner_name")
    .eq("approval_status", "approved");

  if (error) throw new Error(`Failed to load fleet statistics: ${error.message}`);

  const rows = data as { location: string; partner_name: string | null }[];
  return {
    vehicles: rows.length,
    operators: new Set(rows.map((r) => r.partner_name).filter(Boolean)).size,
    locations: new Set(rows.map((r) => r.location)).size,
  };
}

/**
 * Operators with at least one approved vehicle, by name.
 *
 * Read from vehicles.partner_name rather than the partners table, which has no
 * public select policy and holds contact details and document URLs that must
 * not be public. See 20260912120000.
 */
export async function getPartnerNetwork(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("partner_name")
    .eq("approval_status", "approved")
    .not("partner_name", "is", null);

  if (error) throw new Error(`Failed to load the partner network: ${error.message}`);

  const names = new Set((data as { partner_name: string }[]).map((r) => r.partner_name));
  return [...names].sort();
}

/**
 * The one-way fee table, for quoting a route in the booking form before
 * anything is written. booking_one_way_fee() in SQL stays authoritative.
 */
export async function getOneWayFeeTable(): Promise<OneWayFeeTable> {
  const supabase = await createClient();

  const [feesResult, settingsResult] = await Promise.all([
    supabase.from("one_way_fees").select("location_a, location_b, fee"),
    supabase.from("pricing_settings").select("default_one_way_fee").maybeSingle(),
  ]);

  if (feesResult.error) throw new Error(`Failed to load one-way fees: ${feesResult.error.message}`);
  if (settingsResult.error) throw new Error(`Failed to load pricing settings: ${settingsResult.error.message}`);

  const pairs: Record<string, number> = {};
  for (const row of (feesResult.data ?? []) as { location_a: string; location_b: string; fee: number }[]) {
    // Both directions, so the client never has to reproduce Postgres's
    // collation ordering to find a row.
    pairs[oneWayFeeKey(row.location_a, row.location_b)] = Number(row.fee);
    pairs[oneWayFeeKey(row.location_b, row.location_a)] = Number(row.fee);
  }

  const settings = settingsResult.data as { default_one_way_fee: number } | null;

  return { pairs, defaultFee: Number(settings?.default_one_way_fee ?? 0) };
}

export interface RouteFee {
  locationA: string;
  locationB: string;
  fee: number;
}

/** Admin view of the route fee table, plus the fallback for unlisted pairs. */
export async function getRouteFees(): Promise<{ routes: RouteFee[]; defaultFee: number }> {
  const supabase = await createClient();

  const [feesResult, settingsResult] = await Promise.all([
    supabase.from("one_way_fees").select("location_a, location_b, fee").order("location_a"),
    supabase.from("pricing_settings").select("default_one_way_fee").maybeSingle(),
  ]);

  if (feesResult.error) throw new Error(`Failed to load route fees: ${feesResult.error.message}`);
  if (settingsResult.error) throw new Error(`Failed to load pricing settings: ${settingsResult.error.message}`);

  const settings = settingsResult.data as { default_one_way_fee: number } | null;

  return {
    routes: ((feesResult.data ?? []) as { location_a: string; location_b: string; fee: number }[]).map((r) => ({
      locationA: r.location_a,
      locationB: r.location_b,
      fee: Number(r.fee),
    })),
    defaultFee: Number(settings?.default_one_way_fee ?? 0),
  };
}

export interface PricingDefaults {
  weeklyThresholdDays: number;
  weeklyDiscount: number;
  monthlyThresholdDays: number;
  monthlyDiscount: number;
  reservationDepositRate: number;
  securityDepositRate: number;
  defaultOneWayFee: number;
}

export async function getPricingDefaults(): Promise<PricingDefaults> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select(`${PRICING_DEFAULT_COLUMNS}, default_one_way_fee`)
    .maybeSingle();

  if (error) throw new Error(`Failed to load pricing settings: ${error.message}`);
  if (!data) throw new Error("Pricing settings row is missing");

  const row = data as PricingDefaultsRow & { default_one_way_fee: number };
  return {
    weeklyThresholdDays: Number(row.weekly_threshold_days),
    weeklyDiscount: Number(row.weekly_discount),
    monthlyThresholdDays: Number(row.monthly_threshold_days),
    monthlyDiscount: Number(row.monthly_discount),
    reservationDepositRate: Number(row.reservation_deposit_rate),
    securityDepositRate: Number(row.security_deposit_rate),
    defaultOneWayFee: Number(row.default_one_way_fee),
  };
}

export interface VehiclePricingRow {
  id: string;
  label: string;
  licensePlate: string;
  partnerName: string | null;
  approvalStatus: ApprovalStatus;
  pricePerDay: number;
  currency: string;
  /** Null means this vehicle inherits the platform default for that rate. */
  overrides: {
    weeklyThresholdDays: number | null;
    weeklyDiscount: number | null;
    monthlyThresholdDays: number | null;
    monthlyDiscount: number | null;
    reservationDepositRate: number | null;
    securityDepositRate: number | null;
  };
}

/** Every vehicle with its pricing overrides, for the admin pricing dashboard. */
export async function getVehiclePricing(): Promise<VehiclePricingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, make, model, year, license_plate, partner_name, approval_status, price_per_day, currency, weekly_threshold_days, weekly_discount, monthly_threshold_days, monthly_discount, reservation_deposit_rate, security_deposit_rate, is_demo"
    )
    .eq("is_demo", false)
    .order("approval_status")
    .order("make");

  if (error) throw new Error(`Failed to load vehicle pricing: ${error.message}`);

  return (data as unknown as (ListingRow & { license_plate: string; approval_status: ApprovalStatus })[]).map((row) => ({
    id: row.id,
    label: `${row.make} ${row.model} ${row.year}`,
    licensePlate: row.license_plate,
    partnerName: row.partner_name,
    approvalStatus: row.approval_status,
    pricePerDay: Number(row.price_per_day),
    currency: row.currency,
    overrides: {
      weeklyThresholdDays: row.weekly_threshold_days === null ? null : Number(row.weekly_threshold_days),
      weeklyDiscount: row.weekly_discount === null ? null : Number(row.weekly_discount),
      monthlyThresholdDays: row.monthly_threshold_days === null ? null : Number(row.monthly_threshold_days),
      monthlyDiscount: row.monthly_discount === null ? null : Number(row.monthly_discount),
      reservationDepositRate: row.reservation_deposit_rate === null ? null : Number(row.reservation_deposit_rate),
      securityDepositRate: row.security_deposit_rate === null ? null : Number(row.security_deposit_rate),
    },
  }));
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "customer" | "partner" | "admin";
  createdAt: string;
  bookingCount: number;
  partnerName: string | null;
}

/**
 * Every account, for the admin accounts page. Relies on "Admins can view all
 * profiles" (20260904090000).
 *
 * The booking count is here so an operator can tell an account that has done
 * something from one that hasn't — which is what you need before deleting
 * anything.
 */
export async function getAdminAccounts(): Promise<AdminAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, bookings(count), partners(business_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load accounts: ${error.message}`);

  return (data as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: AdminAccount["role"];
    created_at: string;
    bookings: { count: number }[];
    partners: { business_name: string }[];
  }[]).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
    bookingCount: row.bookings?.[0]?.count ?? 0,
    partnerName: row.partners?.[0]?.business_name ?? null,
  }));
}
