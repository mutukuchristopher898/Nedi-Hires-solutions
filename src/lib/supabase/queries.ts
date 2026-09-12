import { createClient } from "./server";
import type {
  AdminBooking,
  ApprovalStatus,
  BookingStatus,
  FuelType,
  PartnerAccount,
  PartnerVehicle,
  Transmission,
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
