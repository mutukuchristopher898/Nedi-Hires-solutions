import { createClient } from "./server";
import { OPTION_LIST_FALLBACKS, type OptionList } from "@/lib/optionLists";
import {
  ABSOLUTE_RESULT_CAP,
  DEFAULT_PAGE_SIZE,
  type SortOption,
} from "@/lib/schemas/search";
import type {
  AdminBooking,
  ApprovalStatus,
  BookingStatus,
  DocumentReview,
  DocumentStatus,
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
  status: DocumentStatus;
  submitted_at: string;
  review_reason?: string | null;
  expires_at?: string | null;
  document_reviews?: {
    id: string;
    reviewer_email: string | null;
    outcome: DocumentReview["outcome"];
    reason: string | null;
    created_at: string;
  }[];
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
    // profiles has to be disambiguated: identity_documents references it twice,
    // as customer_id and reviewed_by. Left unqualified, PostgREST refuses to
    // embed at all and this query throws — taking the admin overview and the
    // verification queue down with it.
    .select(
      "id, doc_type, file_url, status, submitted_at, review_reason, expires_at, bookings(booking_ref), profiles!identity_documents_customer_id_fkey(full_name), document_reviews(id, reviewer_email, outcome, reason, created_at)"
    )
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to load identity documents: ${error.message}`);

  const rows = data as unknown as IdentityDocumentRow[];

  // kyc-documents is private, so a path is not something a browser can load.
  // Signed here rather than in the page because only an admin session can
  // sign these — "kyc_documents_admin_select" is what permits it.
  //
  // createSignedUrls (plural) signs the whole batch in one request. Signing
  // them one at a time meant up to 200 sequential storage round-trips inside
  // a single server render, which is a timeout rather than a slow page.
  //
  // One hour: long enough to work through a queue, short enough that a URL
  // copied out of the page stops working the same day.
  const signedByPath = new Map<string, string>();

  if (rows.length > 0) {
    // Deliberately tolerant: a failure to sign should cost the previews, not
    // the page. The queue is still reviewable without thumbnails.
    const { data: signedData } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrls(rows.map((row) => row.file_url), 60 * 60)
      .catch(() => ({ data: null }));

    for (const entry of signedData ?? []) {
      // Each entry carries its own error: one unreadable object must not cost
      // the whole queue its links.
      if (entry.path && entry.signedUrl && !entry.error) {
        signedByPath.set(entry.path, entry.signedUrl);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    customerName: row.profiles?.full_name ?? null,
    bookingRef: row.bookings?.booking_ref ?? null,
    docType: row.doc_type,
    fileUrl: row.file_url,
    signedUrl: signedByPath.get(row.file_url) ?? null,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewReason: row.review_reason ?? null,
    expiresAt: row.expires_at ?? null,
    // Newest first: what a reviewer wants is the most recent decision, and
    // whether this is the second or third time round.
    history: [...(row.document_reviews ?? [])]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({
        id: r.id,
        reviewerEmail: r.reviewer_email,
        outcome: r.outcome,
        reason: r.reason,
        createdAt: r.created_at,
      })),
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
      .eq("is_demo", isDemo)
      .is("archived_at", null);

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
const SORT_COLUMNS: Record<SortOption, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  price_asc: { column: "price_per_day", ascending: true },
  price_desc: { column: "price_per_day", ascending: false },
  year_desc: { column: "year", ascending: false },
};

export interface VehiclePage {
  vehicles: VehicleListing[];
  /** Total matching the filters, for pagination — not just this page. */
  total: number;
}

export async function getApprovedVehicles(filters: VehicleFilters = {}): Promise<VehiclePage> {
  const supabase = await createClient();

  const buildQuery = (select: string, options?: { count: "exact"; head: true }) => {
    let query = supabase
      .from("vehicles")
      .select(select, options)
      .eq("approval_status", "approved")
      // Explicit, not just RLS: staff can select hidden and archived rows,
      // so without this an admin browsing the customer site would see stock
      // that is deliberately off it.
      .is("hidden_at", null)
      .is("archived_at", null);

    // Filtering in the database rather than in JS: the fleet is meant to grow
    // past the point where fetching all of it per search is reasonable.
    if (filters.location) query = query.eq("location", filters.location);
    if (filters.classification) query = query.eq("classification", filters.classification);
    if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType);
    if (filters.transmission) query = query.eq("transmission", filters.transmission);

    return query;
  };

  // Clamped here as well as in the schema. The schema keeps a URL honest; this
  // is what holds if some future caller passes a number straight in.
  const pageSize = Math.min(Math.max(filters.limit ?? DEFAULT_PAGE_SIZE, 1), ABSOLUTE_RESULT_CAP);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;

  const sort = SORT_COLUMNS[filters.sort ?? "newest"];

  const [listResult, countResult, defaults] = await Promise.all([
    buildQuery(LISTING_COLUMNS)
      .order(sort.column, { ascending: sort.ascending })
      // A stable tiebreak, so a vehicle cannot appear on two pages or none.
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1),
    buildQuery("id", { count: "exact", head: true }),
    loadPricingDefaults(supabase),
  ]);

  if (listResult.error) throw new Error(`Failed to load vehicles: ${listResult.error.message}`);
  if (countResult.error) throw new Error(`Failed to count vehicles: ${countResult.error.message}`);

  return {
    vehicles: (listResult.data as unknown as ListingRow[]).map((row) => toListing(row, defaults)),
    total: countResult.count ?? 0,
  };
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
      .is("hidden_at", null)
      .is("archived_at", null)
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
    .eq("approval_status", "approved")
    .is("hidden_at", null)
    .is("archived_at", null);

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
    .eq("approval_status", "approved")
    .is("hidden_at", null)
    .is("archived_at", null);

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
    .is("hidden_at", null)
    .is("archived_at", null)
    .not("partner_name", "is", null);

  if (error) throw new Error(`Failed to load the partner network: ${error.message}`);

  const names = new Set((data as { partner_name: string }[]).map((r) => r.partner_name));
  return [...names].sort();
}

export interface PricingDefaults {
  weeklyThresholdDays: number;
  weeklyDiscount: number;
  monthlyThresholdDays: number;
  monthlyDiscount: number;
  reservationDepositRate: number;
  securityDepositRate: number;
}

export async function getPricingDefaults(): Promise<PricingDefaults> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pricing_settings")
    .select(PRICING_DEFAULT_COLUMNS)
    .maybeSingle();

  if (error) throw new Error(`Failed to load pricing settings: ${error.message}`);
  if (!data) throw new Error("Pricing settings row is missing");

  const row = data as PricingDefaultsRow;
  return {
    weeklyThresholdDays: Number(row.weekly_threshold_days),
    weeklyDiscount: Number(row.weekly_discount),
    monthlyThresholdDays: Number(row.monthly_threshold_days),
    monthlyDiscount: Number(row.monthly_discount),
    reservationDepositRate: Number(row.reservation_deposit_rate),
    securityDepositRate: Number(row.security_deposit_rate),
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
  role: "customer" | "partner" | "staff" | "admin";
  createdAt: string;
  bookingCount: number;
  partnerName: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  anonymisedAt: string | null;
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
    .select("id, full_name, email, phone, role, created_at, suspended_at, suspension_reason, anonymised_at, bookings(count), partners(business_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load accounts: ${error.message}`);

  return (data as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: AdminAccount["role"];
    created_at: string;
    suspended_at: string | null;
    suspension_reason: string | null;
    anonymised_at: string | null;
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
    suspendedAt: row.suspended_at,
    suspensionReason: row.suspension_reason,
    anonymisedAt: row.anonymised_at,
  }));
}


/** Just the number, for the admin overview — it never needed the documents. */
export async function getPendingDocumentCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("identity_documents")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(`Failed to count identity documents: ${error.message}`);
  return count ?? 0;
}

export interface AuditEntry {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: "insert" | "update" | "delete";
  entityType: string;
  entityId: string | null;
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
}

export interface AuditFilters {
  entityType?: string;
  entityId?: string;
  actorEmail?: string;
  page?: number;
  limit?: number;
}

const AUDIT_PAGE_SIZE = 50;

/**
 * The admin audit trail. Readable by staff, written only by trigger — nobody
 * can edit or remove their own entries through the API, which is the point.
 */
export async function getAuditLog(
  filters: AuditFilters = {}
): Promise<{ entries: AuditEntry[]; total: number }> {
  const supabase = await createClient();

  const build = (select: string, options?: { count: "exact"; head: true }) => {
    let query = supabase.from("admin_audit_log").select(select, options);
    if (filters.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters.entityId) query = query.eq("entity_id", filters.entityId);
    if (filters.actorEmail) query = query.eq("actor_email", filters.actorEmail);
    return query;
  };

  const pageSize = Math.min(Math.max(filters.limit ?? AUDIT_PAGE_SIZE, 1), 200);
  const from = (Math.max(filters.page ?? 1, 1) - 1) * pageSize;

  const [list, count] = await Promise.all([
    build("id, actor_email, actor_role, action, entity_type, entity_id, changes, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1),
    build("id", { count: "exact", head: true }),
  ]);

  if (list.error) throw new Error(`Failed to load the audit log: ${list.error.message}`);
  if (count.error) throw new Error(`Failed to count audit entries: ${count.error.message}`);

  return {
    entries: (list.data as unknown as {
      id: string;
      actor_email: string | null;
      actor_role: string | null;
      action: AuditEntry["action"];
      entity_type: string;
      entity_id: string | null;
      changes: AuditEntry["changes"] | null;
      created_at: string;
    }[]).map((row) => ({
      id: row.id,
      actorEmail: row.actor_email,
      actorRole: row.actor_role,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      changes: row.changes ?? {},
      createdAt: row.created_at,
    })),
    total: count.count ?? 0,
  };
}

export type VehicleLifecycle = "pending" | "live" | "hidden" | "rejected" | "archived";

export interface AdminVehicle extends PartnerVehicle {
  lifecycle: VehicleLifecycle;
  hiddenAt: string | null;
  archivedAt: string | null;
  rejectionReason: string | null;
  imageKey: string;
  isDemo: boolean;
}

export interface AdminVehicleFilters {
  lifecycle?: VehicleLifecycle;
  partnerName?: string;
  location?: string;
  classification?: string;
  /** Registration or model. */
  search?: string;
  page?: number;
  limit?: number;
}

const ADMIN_VEHICLE_PAGE_SIZE = 25;

/** One column derived from three, because an operator thinks in states, not flags. */
function lifecycleOf(row: { approval_status: string; hidden_at: string | null; archived_at: string | null }): VehicleLifecycle {
  if (row.archived_at) return "archived";
  if (row.approval_status === "rejected") return "rejected";
  if (row.approval_status === "pending") return "pending";
  if (row.hidden_at) return "hidden";
  return "live";
}

export async function getAdminVehicles(
  filters: AdminVehicleFilters = {}
): Promise<{ vehicles: AdminVehicle[]; total: number }> {
  const supabase = await createClient();

  const build = (select: string, options?: { count: "exact"; head: true }) => {
    let query = supabase.from("vehicles").select(select, options);

    // Derived states map back onto the three underlying columns.
    switch (filters.lifecycle) {
      case "archived":
        query = query.not("archived_at", "is", null);
        break;
      case "rejected":
        query = query.is("archived_at", null).eq("approval_status", "rejected");
        break;
      case "pending":
        query = query.is("archived_at", null).eq("approval_status", "pending");
        break;
      case "hidden":
        query = query.is("archived_at", null).eq("approval_status", "approved").not("hidden_at", "is", null);
        break;
      case "live":
        query = query.is("archived_at", null).eq("approval_status", "approved").is("hidden_at", null);
        break;
      default:
        // Archived stock is out of the way unless asked for by name.
        query = query.is("archived_at", null);
    }

    if (filters.partnerName) query = query.eq("partner_name", filters.partnerName);
    if (filters.location) query = query.eq("location", filters.location);
    if (filters.classification) query = query.eq("classification", filters.classification);

    if (filters.search) {
      // Escaped: a comma or parenthesis in the term would otherwise be read as
      // PostgREST filter syntax rather than as text.
      const term = filters.search.replace(/[,()*]/g, " ").trim();
      if (term) query = query.or(`license_plate.ilike.%${term}%,model.ilike.%${term}%,make.ilike.%${term}%`);
    }

    return query;
  };

  const pageSize = Math.min(Math.max(filters.limit ?? ADMIN_VEHICLE_PAGE_SIZE, 1), 100);
  const from = (Math.max(filters.page ?? 1, 1) - 1) * pageSize;

  const columns = `${VEHICLE_COLUMNS}, hidden_at, archived_at, rejection_reason, image_key, is_demo, partner_name, partners(business_name)`;

  const [list, count] = await Promise.all([
    build(columns).order("created_at", { ascending: false }).order("id", { ascending: true })
      .range(from, from + pageSize - 1),
    build("id", { count: "exact", head: true }),
  ]);

  if (list.error) throw new Error(`Failed to load vehicles: ${list.error.message}`);
  if (count.error) throw new Error(`Failed to count vehicles: ${count.error.message}`);

  type Row = VehicleRow & {
    hidden_at: string | null;
    archived_at: string | null;
    rejection_reason: string | null;
    image_key: string;
    is_demo: boolean;
    partner_name: string | null;
  };

  return {
    vehicles: (list.data as unknown as Row[]).map((row) => ({
      ...toPartnerVehicle(row),
      partnerName: row.partners?.business_name ?? row.partner_name,
      lifecycle: lifecycleOf(row),
      hiddenAt: row.hidden_at,
      archivedAt: row.archived_at,
      rejectionReason: row.rejection_reason,
      imageKey: row.image_key,
      isDemo: row.is_demo,
    })),
    total: count.count ?? 0,
  };
}

/** Distinct partner names with at least one vehicle, for the filter dropdown. */
export async function getVehiclePartnerNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("partner_name")
    .not("partner_name", "is", null)
    .is("archived_at", null);

  if (error) throw new Error(`Failed to load partners: ${error.message}`);
  return [...new Set((data as { partner_name: string }[]).map((r) => r.partner_name))].sort();
}

export interface PartnerOption {
  id: string;
  businessName: string;
  status: ApprovalStatus;
}

/** Partner accounts an admin can attribute a vehicle to. */
export async function getPartnerOptions(): Promise<PartnerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("id, business_name, status")
    .order("business_name");

  if (error) throw new Error(`Failed to load partners: ${error.message}`);
  return (data as { id: string; business_name: string; status: ApprovalStatus }[]).map((r) => ({
    id: r.id,
    businessName: r.business_name,
    status: r.status,
  }));
}

/** One vehicle for the admin edit screen, at any lifecycle state. */
/**
 * Everything the review screen needs about one vehicle, including who is
 * offering it and whether it can still be deleted.
 *
 * The partner's own record is pulled in whole rather than just its name:
 * approving a vehicle is a decision about the business behind it as much as
 * the car, and an operator should not have to open a second screen to see
 * whether that business was ever approved itself.
 */
export interface AdminVehicleDetail extends AdminVehicle {
  partner: {
    id: string;
    businessName: string;
    businessEmail: string | null;
    status: string;
    taxCredentialUrl: string | null;
    idDocumentUrl: string | null;
    ownerProfileId: string;
  } | null;
  /** Bookings referencing this vehicle. Non-zero means it cannot be deleted. */
  bookingCount: number;
}

export async function getAdminVehicleById(id: string): Promise<AdminVehicleDetail | null> {
  const supabase = await createClient();

  // The booking count is a separate head request rather than an embed: it is
  // wanted as a number, and embedding would drag every booking row back to
  // count them here.
  const [vehicleResult, bookingResult] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        `${VEHICLE_COLUMNS}, hidden_at, archived_at, rejection_reason, image_key, is_demo, partner_name, ` +
          `partners(id, business_name, business_email, status, tax_credential_url, id_document_url, owner_profile_id)`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("vehicle_id", id),
  ]);

  if (vehicleResult.error) throw new Error(`Failed to load vehicle: ${vehicleResult.error.message}`);
  if (!vehicleResult.data) return null;

  const row = vehicleResult.data as unknown as VehicleRow & {
    hidden_at: string | null;
    archived_at: string | null;
    rejection_reason: string | null;
    image_key: string;
    is_demo: boolean;
    partner_name: string | null;
    partners?: {
      id: string;
      business_name: string;
      business_email: string | null;
      status: string;
      tax_credential_url: string | null;
      id_document_url: string | null;
      owner_profile_id: string;
    } | null;
  };

  const partner = row.partners ?? null;

  return {
    ...toPartnerVehicle(row as VehicleRow),
    partnerName: partner?.business_name ?? row.partner_name,
    lifecycle: lifecycleOf(row),
    hiddenAt: row.hidden_at,
    archivedAt: row.archived_at,
    rejectionReason: row.rejection_reason,
    imageKey: row.image_key,
    isDemo: row.is_demo,
    partner: partner
      ? {
          id: partner.id,
          businessName: partner.business_name,
          businessEmail: partner.business_email,
          status: partner.status,
          taxCredentialUrl: partner.tax_credential_url,
          idDocumentUrl: partner.id_document_url,
          ownerProfileId: partner.owner_profile_id,
        }
      : null,
    // A count request with head:true returns the number and no rows. Null
    // would mean the count failed, and treating that as zero would offer a
    // delete button for a vehicle that may well have bookings.
    bookingCount: bookingResult.count ?? -1,
  };
}

export interface AccountDetail extends AdminAccount {
  bookings: AdminBooking[];
  documents: PendingDocument[];
  enquiryCount: number;
}

/** Everything about one account in one place, which is what a support call needs. */
export async function getAccountDetail(id: string): Promise<AccountDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, suspended_at, suspension_reason, anonymised_at, partners(business_name)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load the account: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as {
    id: string; full_name: string; email: string | null; phone: string | null;
    role: AdminAccount["role"]; created_at: string;
    suspended_at: string | null; suspension_reason: string | null; anonymised_at: string | null;
    partners: { business_name: string }[];
  };

  const [bookingsResult, documentsResult, enquiriesResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, booking_ref, status, start_date, end_date, total_amount, currency, created_at, profiles(full_name), vehicles(make, model, year, license_plate)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("identity_documents")
      .select("id, doc_type, file_url, status, submitted_at, bookings(booking_ref), profiles!identity_documents_customer_id_fkey(full_name)")
      .eq("customer_id", id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_profile_id", id),
  ]);

  if (bookingsResult.error) throw new Error(`Failed to load bookings: ${bookingsResult.error.message}`);
  if (documentsResult.error) throw new Error(`Failed to load documents: ${documentsResult.error.message}`);

  const today = new Date().toISOString().slice(0, 10);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
    partnerName: row.partners?.[0]?.business_name ?? null,
    suspendedAt: row.suspended_at,
    suspensionReason: row.suspension_reason,
    anonymisedAt: row.anonymised_at,
    bookingCount: (bookingsResult.data ?? []).length,
    enquiryCount: enquiriesResult.count ?? 0,
    bookings: (bookingsResult.data as unknown as AdminBookingRow[]).map((b) => ({
      id: b.id,
      bookingRef: b.booking_ref,
      status: b.status,
      startDate: b.start_date,
      endDate: b.end_date,
      totalAmount: b.total_amount,
      currency: b.currency,
      createdAt: b.created_at,
      customerName: b.profiles?.full_name ?? null,
      vehicleLabel: b.vehicles ? `${b.vehicles.make} ${b.vehicles.model} ${b.vehicles.year}` : "Unknown vehicle",
      licensePlate: b.vehicles?.license_plate ?? "—",
      holdsVehicle: b.status !== "cancelled" && b.end_date >= today,
    })),
    documents: (documentsResult.data as unknown as IdentityDocumentRow[]).map((d) => ({
      id: d.id,
      customerName: d.profiles?.full_name ?? null,
      bookingRef: d.bookings?.booking_ref ?? null,
      docType: d.doc_type,
      fileUrl: d.file_url,
      // Signed separately on the page that needs previews; the account view
      // lists what exists rather than rendering every document.
      signedUrl: null,
      status: d.status,
      submittedAt: d.submitted_at,
      reviewReason: d.review_reason ?? null,
      expiresAt: d.expires_at ?? null,
      history: [],
    })),
  };
}

export interface AdminOption {
  list: OptionList;
  value: string;
  sortOrder: number;
  active: boolean;
}

/**
 * Active values for one list, in order.
 *
 * Falls back to the built-in list rather than throwing. These populate forms
 * on public pages, and a missing table or a transient failure should degrade
 * to the previous behaviour rather than take a page down.
 */
export async function getOptions(list: OptionList): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_options")
      .select("value, sort_order")
      .eq("list", list)
      .eq("active", true)
      .order("sort_order");

    if (error || !data || data.length === 0) return OPTION_LIST_FALLBACKS[list];
    return (data as { value: string }[]).map((row) => row.value);
  } catch {
    return OPTION_LIST_FALLBACKS[list];
  }
}

/** Every option including retired ones, for the Settings screen. */
export async function getAllOptions(): Promise<AdminOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_options")
    .select("list, value, sort_order, active")
    .order("list")
    .order("sort_order");

  if (error) throw new Error(`Failed to load option lists: ${error.message}`);

  return (data as { list: OptionList; value: string; sort_order: number; active: boolean }[]).map((row) => ({
    list: row.list,
    value: row.value,
    sortOrder: row.sort_order,
    active: row.active,
  }));
}

// ─────────────────────────────────────────────────────────────
// Vehicle documents
// ─────────────────────────────────────────────────────────────

export type VehicleDocumentStatus = "pending" | "approved" | "rejected" | "returned";

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  docType: string;
  filePath: string;
  /** Null when signing failed; the row is still listed, just without a preview. */
  signedUrl: string | null;
  status: VehicleDocumentStatus;
  expiresAt: string | null;
  reviewReason: string | null;
  reviewedAt: string | null;
  submittedAt: string;
}

interface VehicleDocumentRow {
  id: string;
  vehicle_id: string;
  doc_type: string;
  file_path: string;
  status: VehicleDocumentStatus;
  expires_at: string | null;
  review_reason: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

const VEHICLE_DOCUMENT_COLUMNS =
  "id, vehicle_id, doc_type, file_path, status, expires_at, review_reason, reviewed_at, submitted_at";

/**
 * Signs a batch of vehicle-document paths in one request.
 *
 * Deliberately tolerant on every axis: the bucket is private, so a path is
 * useless to a browser, but a failure to sign should cost the previews and
 * not the page — the paperwork is still listed and reviewable by its type,
 * status and dates. Mirrors getPendingDocuments.
 */
async function signVehicleDocuments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[]
): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  if (paths.length === 0) return signed;

  const { data } = await supabase.storage
    .from("vehicle-documents")
    .createSignedUrls(paths, 60 * 60)
    .catch(() => ({ data: null }));

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl && !entry.error) {
      signed.set(entry.path, entry.signedUrl);
    }
  }
  return signed;
}

function toVehicleDocument(row: VehicleDocumentRow, signed: Map<string, string>): VehicleDocument {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    docType: row.doc_type,
    filePath: row.file_path,
    signedUrl: signed.get(row.file_path) ?? null,
    status: row.status,
    expiresAt: row.expires_at,
    reviewReason: row.review_reason,
    reviewedAt: row.reviewed_at,
    submittedAt: row.submitted_at,
  };
}

/**
 * The paperwork for one vehicle.
 *
 * Returns an empty list rather than throwing when the table is not there yet.
 * Deploys and hand-pasted migrations are never simultaneous, and a vehicle
 * screen that 500s in the gap is worse than one briefly showing no documents.
 */
export async function getVehicleDocuments(vehicleId: string): Promise<VehicleDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select(VEHICLE_DOCUMENT_COLUMNS)
    .eq("vehicle_id", vehicleId)
    .order("submitted_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as unknown as VehicleDocumentRow[];
  const signed = await signVehicleDocuments(supabase, rows.map((r) => r.file_path));
  return rows.map((row) => toVehicleDocument(row, signed));
}

export interface VehicleDocumentAlert extends VehicleDocument {
  vehicleLabel: string;
  licensePlate: string;
}

/**
 * Documents needing attention across the whole fleet: anything awaiting
 * review, and any approved document that has expired or is about to.
 *
 * An expired insurance certificate is the one that matters — it means a
 * vehicle is bookable today that should not be — so it is surfaced on the
 * dashboard rather than waiting to be found on a vehicle page.
 */
export async function getVehicleDocumentAlerts(
  expiryWindowDays = 30
): Promise<{ pending: VehicleDocumentAlert[]; expiring: VehicleDocumentAlert[]; expired: VehicleDocumentAlert[] }> {
  const empty = { pending: [], expiring: [], expired: [] };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicle_documents")
    .select(`${VEHICLE_DOCUMENT_COLUMNS}, vehicles(make, model, year, license_plate)`)
    .in("status", ["pending", "approved"])
    .order("submitted_at", { ascending: false })
    .limit(500);

  if (error || !data) return empty;

  const rows = data as unknown as (VehicleDocumentRow & {
    vehicles?: { make: string; model: string; year: number; license_plate: string } | null;
  })[];

  const signed = await signVehicleDocuments(supabase, rows.map((r) => r.file_path));

  const alerts: VehicleDocumentAlert[] = rows.map((row) => ({
    ...toVehicleDocument(row, signed),
    vehicleLabel: row.vehicles
      ? `${row.vehicles.make} ${row.vehicles.model} ${row.vehicles.year}`
      : "Unknown vehicle",
    licensePlate: row.vehicles?.license_plate ?? "",
  }));

  // Compared at UTC midnight on both sides so "expires today" is not decided
  // by what time the page happens to be rendered.
  const today = new Date().setUTCHours(0, 0, 0, 0);
  const daysUntil = (date: string) =>
    Math.round((new Date(`${date}T00:00:00Z`).getTime() - today) / 86_400_000);

  return {
    pending: alerts.filter((d) => d.status === "pending"),
    expired: alerts.filter(
      (d) => d.status === "approved" && d.expiresAt && daysUntil(d.expiresAt) < 0
    ),
    expiring: alerts.filter(
      (d) =>
        d.status === "approved" &&
        d.expiresAt &&
        daysUntil(d.expiresAt) >= 0 &&
        daysUntil(d.expiresAt) <= expiryWindowDays
    ),
  };
}

/** Every document belonging to a partner's own vehicles, for their dashboard. */
export async function getPartnerVehicleDocuments(
  vehicleIds: string[]
): Promise<Map<string, VehicleDocument[]>> {
  const byVehicle = new Map<string, VehicleDocument[]>();
  if (vehicleIds.length === 0) return byVehicle;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select(VEHICLE_DOCUMENT_COLUMNS)
    .in("vehicle_id", vehicleIds)
    .order("submitted_at", { ascending: false });

  if (error || !data) return byVehicle;

  const rows = data as unknown as VehicleDocumentRow[];
  const signed = await signVehicleDocuments(supabase, rows.map((r) => r.file_path));

  for (const row of rows) {
    const list = byVehicle.get(row.vehicle_id) ?? [];
    list.push(toVehicleDocument(row, signed));
    byVehicle.set(row.vehicle_id, list);
  }
  return byVehicle;
}
