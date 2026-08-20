// Kenyan vehicle registration plates: K + 2 letters, 3 digits, 1 letter
// (e.g. "KDX 123A"). The space is optional/either-cased in practice.
const KENYA_PLATE_REGEX = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;

export function validateKenyanPlate(rawValue: string, fieldLabel = "License plate"): { valid: boolean; message?: string } {
  const value = rawValue.trim().toUpperCase();
  if (!value) return { valid: false, message: `${fieldLabel} is required.` };
  if (!KENYA_PLATE_REGEX.test(value)) {
    return { valid: false, message: `${fieldLabel} doesn't match the standard Kenyan format (e.g. KDX 123A).` };
  }
  return { valid: true };
}
