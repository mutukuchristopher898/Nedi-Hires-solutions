// Postgres raises 23P01 (exclusion_violation) for both availability layers:
// the exclusion constraint over confirmed bookings, and the trigger covering
// the 30-minute hold on unconfirmed ones. The trigger's own message is written
// for a customer, but the constraint's is Postgres's default
// ("conflicting key value violates exclusion constraint ..."), so both are
// mapped to one sentence here rather than either reaching a booking screen.

export const VEHICLE_UNAVAILABLE_MESSAGE =
  "Someone else has just taken this vehicle for those dates. Please choose different dates, or pick another vehicle.";

const EXCLUSION_VIOLATION = "23P01";

// program_limit_exceeded, raised by enforce_rate_limit (20260913120000).
const RATE_LIMITED = "54000";

export const RATE_LIMITED_MESSAGE =
  "You're doing that too often. Wait a moment and try again.";

export function bookingErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;
  if (error.code === EXCLUSION_VIOLATION) return VEHICLE_UNAVAILABLE_MESSAGE;
  if (error.code === RATE_LIMITED) return RATE_LIMITED_MESSAGE;
  return error.message || fallback;
}
