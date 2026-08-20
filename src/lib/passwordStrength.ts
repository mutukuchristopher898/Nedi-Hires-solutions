export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  meetsMinimum: boolean;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
  };
}

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

// Minimum bar to create an account: 8+ characters and at least 3 of the 4
// character classes (upper/lower/digit/symbol) — "Strong" or better.
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const classesMet = [checks.hasUpper, checks.hasLower, checks.hasDigit, checks.hasSymbol].filter(Boolean).length;

  let score: PasswordStrengthResult["score"] = 0;
  if (checks.minLength) score = 1;
  if (checks.minLength && classesMet >= 2) score = 2;
  if (checks.minLength && classesMet >= 3) score = 3;
  if (password.length >= 12 && classesMet >= 3) score = 4;

  return { score, label: LABELS[score], meetsMinimum: score >= 3, checks };
}
