import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export interface PhoneValidationResult {
  valid: boolean;
  e164?: string;
  message?: string;
}

// spec §4 — never hand-roll phone regex. Runs identically client- and
// server-side; the caller must always send the raw, as-typed value (never a
// client-precomputed E.164 string) so this is the one place that derives it.
export function validatePhoneNumber(rawValue: string, defaultCountry: string, fieldLabel: string): PhoneValidationResult {
  const value = rawValue.trim();
  if (!value) {
    return { valid: false, message: `${fieldLabel} is required.` };
  }

  const parsed = parsePhoneNumberFromString(value, defaultCountry as CountryCode);
  if (!parsed || !parsed.isValid()) {
    return { valid: false, message: `${fieldLabel} doesn't look like a valid phone number for the selected country.` };
  }

  const nationalDigits = parsed.nationalNumber;
  if (/^(\d)\1*$/.test(nationalDigits)) {
    return { valid: false, message: `${fieldLabel} can't be the same digit repeated.` };
  }

  return { valid: true, e164: parsed.number };
}
