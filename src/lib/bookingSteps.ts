import type { BookingStep } from "@/lib/types";

export const STEP_ORDER: BookingStep[] = [
  "trip",
  "applicant",
  "selfie",
  "agreement",
  "deposit",
  "verification",
  "settlement",
  "confirmed",
];

export const STEP_LABELS: Record<BookingStep, string> = {
  trip: "Trip Details",
  applicant: "Applicant & Guarantor",
  selfie: "Selfie Verification",
  agreement: "Rental Agreement",
  deposit: "Reservation & Deposit",
  verification: "Verification",
  settlement: "Settlement",
  confirmed: "Confirmed",
};

// Once a deposit has been paid, moving backward through the flow (in-app,
// via a direct URL, or the browser's own back button) is locked — spec §6:
// "Do not allow backward navigation after payment authorisation."
export function isBackable(step: BookingStep, lockedAfterPayment: boolean): boolean {
  return !lockedAfterPayment && step !== "trip";
}

export function previousStep(step: BookingStep): BookingStep | null {
  const index = STEP_ORDER.indexOf(step);
  return index > 0 ? STEP_ORDER[index - 1] : null;
}

export function nextStep(step: BookingStep): BookingStep | null {
  const index = STEP_ORDER.indexOf(step);
  return index >= 0 && index < STEP_ORDER.length - 1 ? STEP_ORDER[index + 1] : null;
}
