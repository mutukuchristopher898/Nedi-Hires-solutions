const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function validateEmail(rawValue: string, fieldLabel = "Email"): { valid: boolean; message?: string } {
  const value = rawValue.trim();
  if (!value) return { valid: false, message: `${fieldLabel} is required.` };
  if (value.length > 254) return { valid: false, message: `${fieldLabel} is too long.` };

  const [local] = value.split("@");
  if (!EMAIL_REGEX.test(value) || !local || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, message: `${fieldLabel} doesn't look like a valid email address.` };
  }

  return { valid: true };
}
