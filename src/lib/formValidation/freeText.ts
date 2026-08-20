// A light structural guard for free-text message/notes fields — catches
// empty submissions and obvious gibberish/placeholder text without trying
// to judge genuine, unpredictable customer wording.
export function validateMessage(
  rawValue: string,
  fieldLabel: string,
  options: { required?: boolean; minLength?: number } = {}
): { valid: boolean; message?: string } {
  const { required = true, minLength = 10 } = options;
  const value = rawValue.trim();

  if (!value) {
    return required ? { valid: false, message: `${fieldLabel} is required.` } : { valid: true };
  }
  if (value.length < minLength) {
    return { valid: false, message: `${fieldLabel} is too short — please add a bit more detail.` };
  }
  if (/^(.)\1*$/iu.test(value.replace(/\s/g, ""))) {
    return { valid: false, message: `${fieldLabel} can't be a single character repeated.` };
  }

  return { valid: true };
}
