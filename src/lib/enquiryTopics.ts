// What a contact-form message is about. Stored as `subject` on
// contact_messages so the admin inbox can show it, and preselected when a
// service links to /contact?topic=<value>.

export interface EnquiryTopic {
  value: string;
  label: string;
  /** Suggests what to include, shown in the empty message box. */
  placeholder: string;
}

export const ENQUIRY_TOPICS: EnquiryTopic[] = [
  {
    value: "general",
    label: "General enquiry",
    placeholder: "How can we help?",
  },
  {
    value: "booking",
    label: "Help with a booking",
    placeholder: "Your booking reference (if you have one) and what you need help with.",
  },
  {
    value: "corporate-leasing",
    label: "Corporate leasing",
    placeholder:
      "Your company name, how many vehicles, which types, how long you need them, and self drive or chauffeur driven.",
  },
  {
    value: "driver-hire",
    label: "Driver hire (for your own vehicle)",
    placeholder:
      "Your vehicle type and gearbox (automatic or manual), the dates and hours, where the driver should start, and whether it’s personal or for a company.",
  },
  {
    value: "insurance-replacement",
    label: "Insurance replacement vehicle",
    placeholder:
      "Your insurance company, the claim reference if you have one, the type of vehicle being repaired, the customer’s location and roughly how long repairs will take.",
  },
  {
    value: "tours-and-events",
    label: "Tours, safaris or events",
    placeholder: "Where you’re going, your dates and how many people.",
  },
];

export const DEFAULT_TOPIC = "general";

/** Topics where the person is asking for a price: the form becomes a quote request. */
export const QUOTE_TOPICS = new Set(["corporate-leasing", "insurance-replacement", "driver-hire", "tours-and-events"]);

export function findTopic(value: string | null | undefined): EnquiryTopic | undefined {
  return ENQUIRY_TOPICS.find((t) => t.value === value);
}
