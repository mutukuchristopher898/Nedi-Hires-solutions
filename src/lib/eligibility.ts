// Thresholds mirror the `check_driver_eligibility` trigger in
// supabase/migrations/20260820120000_trip_details_kyc_and_agreement.sql —
// keep both in sync if these change.
export const MIN_SELF_DRIVE_AGE = 27;
export const MIN_LICENSE_YEARS = 3;

function yearsSince(dateStr: string, from: Date = new Date()): number {
  const date = new Date(dateStr);
  let years = from.getFullYear() - date.getFullYear();
  const monthDay = from.getMonth() - date.getMonth() || from.getDate() - date.getDate();
  if (monthDay < 0) years -= 1;
  return years;
}

export function calculateAge(dateOfBirth: string): number {
  return yearsSince(dateOfBirth);
}

export function calculateYearsSince(date: string): number {
  return yearsSince(date);
}

export function isSelfDriveEligible(dateOfBirth: string, licenseIssueDate: string): boolean {
  return (
    calculateAge(dateOfBirth) >= MIN_SELF_DRIVE_AGE &&
    calculateYearsSince(licenseIssueDate) >= MIN_LICENSE_YEARS
  );
}
