// The editable option lists, with the values they had when they were hardcoded
// kept here as the fallback.
//
// The fallback is not belt-and-braces — it is what lets the code ship
// independently of the migration. A deploy that lands before the table exists
// falls back to these and behaves exactly as it did before, rather than taking
// pages down. Shipping code that hard-depends on unapplied schema is how the
// public site went down once already.

export type OptionList =
  | "pickup_location"
  | "vehicle_feature"
  | "vehicle_rejection_reason"
  | "document_rejection_reason"
  | "document_type"
  | "vehicle_document_type"
  | "vehicle_document_rejection_reason";

export const OPTION_LIST_LABELS: Record<OptionList, string> = {
  pickup_location: "Pickup locations",
  vehicle_feature: "Vehicle features",
  vehicle_rejection_reason: "Vehicle rejection reasons",
  document_rejection_reason: "Document rejection reasons",
  document_type: "Document types",
  vehicle_document_type: "Vehicle document types",
  vehicle_document_rejection_reason: "Vehicle document rejection reasons",
};

export const OPTION_LIST_HINTS: Record<OptionList, string> = {
  pickup_location: "Offered when a partner lists a vehicle and when a customer picks a branch.",
  vehicle_feature: "The amenity chips on a listing.",
  vehicle_rejection_reason: "Preset reasons when turning down a submitted vehicle.",
  document_rejection_reason: "Preset reasons when rejecting or returning an identity document.",
  document_type: "Kinds of identity document a customer can submit.",
  vehicle_document_type: "Paperwork a partner must supply for each vehicle, logbook, insurance, inspection.",
  vehicle_document_rejection_reason: "Preset reasons when rejecting or returning a vehicle document.",
};

export const OPTION_LIST_FALLBACKS: Record<OptionList, string[]> = {
  pickup_location: [
    "Nairobi CBD",
    "Jomo Kenyatta International Airport (JKIA)",
    "Mombasa Moi International Airport",
    "Kisumu",
  ],
  vehicle_feature: [
    "Bluetooth",
    "USB Charging",
    "Reverse Camera",
    "Air Conditioning",
    "Fuel Efficient",
    "Spacious Boot",
    "GPS Navigation",
    "Child Seat Available",
  ],
  vehicle_rejection_reason: [
    "Photos are unclear or don't show the vehicle",
    "Registration number doesn't match the documents",
    "Price is outside what we can list",
    "Vehicle doesn't meet our condition standard",
    "Missing or expired documentation",
  ],
  document_rejection_reason: [
    "Image is blurry or unreadable",
    "Document has expired",
    "Wrong document type submitted",
    "Name does not match the booking",
    "Other",
  ],
  document_type: ["International Passport", "Driver's License", "National ID"],
  vehicle_document_type: ["Logbook", "Insurance Certificate", "Inspection Certificate", "PSV Licence"],
  vehicle_document_rejection_reason: [
    "Document is unreadable, please upload a clearer scan",
    "Expired, please upload a current certificate",
    "Registration does not match the vehicle listed",
    "Name on the document does not match the partner account",
    "Wrong document type for this slot",
    "Pages are missing",
  ],
};

export const ALL_OPTION_LISTS = Object.keys(OPTION_LIST_LABELS) as OptionList[];
