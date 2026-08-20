// Lighter than the KYC person-name validator (documentValidation/nameValidation.ts)
// — business names legitimately contain digits, ampersands, and other
// punctuation ("24/7 Rides & Tours"), so the strict \p{L}-only rule doesn't apply.
export function validateBusinessName(rawValue: string, fieldLabel: string): { valid: boolean; message?: string } {
  const value = rawValue.trim();

  if (value.length < 2) {
    return { valid: false, message: `${fieldLabel} must be at least 2 characters.` };
  }
  if (value.length > 80) {
    return { valid: false, message: `${fieldLabel} must be 80 characters or fewer.` };
  }
  if (/^(.)\1*$/iu.test(value.replace(/\s/g, ""))) {
    return { valid: false, message: `${fieldLabel} can't be a single character repeated.` };
  }
  if (/(.)\1{3,}/u.test(value)) {
    return { valid: false, message: `${fieldLabel} doesn't look right.` };
  }

  return { valid: true };
}
