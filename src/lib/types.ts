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

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  currency: "USD" | "KES";
  tierClass: VehicleClassification[];
  swapsPerMonth: number;
  highlight?: boolean;
  perks: string[];
}

export type BookingStep = "deposit" | "verification" | "settlement" | "confirmed";

export interface PartnerUnit {
  id: string;
  vehicleName: string;
  classification: VehicleClassification;
  submittedOn: string;
  status: ApprovalStatus;
}

export interface DocumentQueueItem {
  id: string;
  customerName: string;
  bookingRef: string;
  docType: "International Passport" | "Driver's License" | "National ID";
  submittedOn: string;
  status: ApprovalStatus;
}
