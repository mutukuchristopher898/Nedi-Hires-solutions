import type { DurationUnit } from "./duration";

export type VehicleClassification =
  | "Economy"
  | "SUV"
  | "Luxury"
  | "Bus"
  | "Road-Trip Van";

export type FuelType = "Petrol" | "Diesel" | "Hybrid" | "Electric";

export type Transmission = "Automatic" | "Manual";

export type FleetSource = "internal" | "partner";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  classification: VehicleClassification;
  fuelType: FuelType;
  transmission: Transmission;
  capacity: number;
  licensePlate: string;
  location: string;
  pricePerDay: number;
  currency: "USD" | "KES" | "EUR" | "GBP";
  rating: number;
  trips: number;
  image: string;
  fleetSource: FleetSource;
  partnerName?: string;
  approvalStatus: ApprovalStatus;
  features: string[];
  description: string;
}

export type SubscriptionAudience = "individual" | "diaspora" | "corporate" | "partner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  audience: SubscriptionAudience;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  annualPrice?: number;
  currency: "USD" | "KES";
  tierClass: VehicleClassification[];
  swapsPerMonth: number;
  vehicleCountMax?: number;
  highlight?: boolean;
  perks: string[];
}

export interface QuoteRequest {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  vehicleCount: number;
  vehicleTypes: string | null;
  notes: string | null;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

export type LoyaltyTier = "bronze" | "silver" | "gold";

export interface LoyaltyAccount {
  pointsBalance: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
}

export interface LoyaltyTransaction {
  id: string;
  pointsDelta: number;
  reason: string;
  createdAt: string;
}

export type BookingStep =
  | "trip"
  | "applicant"
  | "selfie"
  | "agreement"
  | "deposit"
  | "verification"
  | "settlement"
  | "confirmed";

export type Purpose = "personal" | "commercial";
export type DriveType = "self_drive" | "chauffeur";
export type IdType = "International Passport" | "National ID";

export interface TripDetails {
  pickupDate: string;
  pickupTime: string;
  pickupPoint: string;
  destination: string;
  purpose: Purpose;
  durationUnit: DurationUnit;
  durationQuantity: number;
  dropoffDate: string;
  dropoffTime: string;
  returnToDifferentLocation: boolean;
  dropoffPoint: string;
  driveType: DriveType;
  dateOfBirth: string;
  licenseIssueDate: string;
}

export interface BookingApplicant {
  nationality: string;
  surname: string;
  givenNames: string;
  middleName: string;
  mononymDeclared: boolean;
  idType: IdType;
  idNumber: string;
  licenseNumber: string;
  address: string;
  phoneNumber: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelationship: string;
}

export interface PartnerUnit {
  id: string;
  vehicleName: string;
  classification: VehicleClassification;
  submittedOn: string;
  status: ApprovalStatus;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

// A real identity document awaiting review, joined to the booking it belongs
// to and the customer who submitted it. Distinct from DocumentQueueItem
// below, which is the shape of the illustrative sample data in data.ts.
export interface PendingDocument {
  id: string;
  customerName: string | null;
  bookingRef: string | null;
  docType: string;
  fileUrl: string;
  status: ApprovalStatus;
  submittedAt: string;
}

export interface DocumentQueueItem {
  id: string;
  customerName: string;
  bookingRef: string;
  docType: "International Passport" | "Driver's License" | "National ID";
  submittedOn: string;
  status: ApprovalStatus;
}

export type BookingStatus =
  | "deposit_pending"
  | "verification_pending"
  | "settlement_pending"
  | "confirmed"
  | "cancelled";

export interface AdminBooking {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  customerName: string | null;
  vehicleLabel: string;
  licensePlate: string;
  /** True while this booking still withholds its vehicle from other customers. */
  holdsVehicle: boolean;
}

export interface PartnerAccount {
  id: string;
  businessName: string;
  businessEmail: string | null;
  status: ApprovalStatus;
  createdAt: string;
}

export interface PartnerVehicle {
  id: string;
  slug: string | null;
  make: string;
  model: string;
  year: number;
  classification: VehicleClassification;
  fuelType: FuelType;
  transmission: Transmission;
  capacity: number;
  licensePlate: string;
  location: string;
  pricePerDay: number;
  currency: string;
  description: string;
  features: string[];
  photoPaths: string[];
  approvalStatus: ApprovalStatus;
  createdAt: string;
  /** Only populated for the admin queue, where the owning business matters. */
  partnerName?: string | null;
  partnerId?: string | null;
}
