import type { BookingStep } from "@/lib/types";
import { SELFIE_VERIFICATION_ENABLED } from "@/lib/features";

const ALL_STEPS: BookingStep[] = [
  "trip",
  "applicant",
  "selfie",
  "agreement",
  "deposit",
  "verification",
  "settlement",
  "confirmed",
];

// The steps actually shown. A switched-off step is left out entirely, so the
// progress bar, the step count and Back/next all skip it.
export const STEP_ORDER: BookingStep[] = ALL_STEPS.filter(
  (step) => step !== "selfie" || SELFIE_VERIFICATION_ENABLED,
);

/**
 * A booking draft saved while a step was still switched on can name that step
 * as the furthest one reached. Treat it as the step that now follows, so the
 * customer is not stranded.
 */
export function visibleStep(step: BookingStep): BookingStep {
  if (step === "selfie" && !SELFIE_VERIFICATION_ENABLED) return "agreement";
  return step;
}

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
