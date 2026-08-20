import type { CountryDocumentRule, DocumentTier } from "./countryReference";
import { getSampleValueBlacklist, normalizeDocumentNumber } from "./countryReference";
import { NATIONAL_ID_CHECKSUMS } from "./checksums";

export type DocumentField = "passport" | "national_id" | "driving_licence";

export interface DocumentValidationResult {
  outcome: "valid" | "warn" | "reject";
  message?: string;
}

// spec §3.3 — universal, apply to every country and every tier.
const TRIVIAL_SEQUENCES = new Set(["123456", "1234567890", "abcdef", "000000", "999999", "12345678"]);
const DUMMY_VALUES = new Set(["passport", "number", "na", "n/a", "none", "test", "asdf", "0000000"]);

function isAllIdenticalChar(value: string): boolean {
  return /^(.)\1*$/.test(value);
}

export function runUniversalStructuralChecks(normalized: string, documentLabel: string): DocumentValidationResult | null {
  if (normalized.length < 6 || normalized.length > 20) {
    return { outcome: "reject", message: `Please enter your full ${documentLabel} number.` };
  }
  if (!/\d/.test(normalized)) {
    return { outcome: "reject", message: `This doesn't look like a real ${documentLabel} number — it must contain at least one digit.` };
  }
  if (isAllIdenticalChar(normalized)) {
    return { outcome: "reject", message: `This ${documentLabel} number can't be a single character repeated.` };
  }
  if (TRIVIAL_SEQUENCES.has(normalized.toLowerCase()) || DUMMY_VALUES.has(normalized.toLowerCase())) {
    return { outcome: "reject", message: `This looks like a placeholder, not a real ${documentLabel} number.` };
  }
  if (getSampleValueBlacklist().has(normalized)) {
    return { outcome: "reject", message: "This looks like the example value from a reference document, not your actual number. Please enter your own." };
  }
  return null;
}

function labelForField(field: DocumentField, rule: CountryDocumentRule): string {
  if (field === "passport") return "passport";
  if (field === "national_id") return rule.national_id_name || "national ID";
  return rule.driving_licence_name || "driving licence";
}

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

// spec §3.2 — enforcement depends on the tier. strict hard-rejects a format
// mismatch; warn allows an override; generic/state (the latter deliberately
// scoped down to generic-style structural-only checks — no per-US-state/
// province table is built in this phase) never hard-block on the country
// regex, only on the universal structural checks above.
export function validateDocumentNumber(params: {
  rawValue: string;
  field: DocumentField;
  iso2: string;
  rule: CountryDocumentRule;
}): DocumentValidationResult {
  const { rawValue, field, iso2, rule } = params;
  const normalized = normalizeDocumentNumber(rawValue);
  const documentLabel = labelForField(field, rule);

  const structural = runUniversalStructuralChecks(normalized, documentLabel);
  if (structural) return structural;

  const tier = rule[`${field}_tier`] as DocumentTier;
  const regex = safeRegex(rule[`${field}_regex`]);
  const shaped = rawValue.trim().toUpperCase();
  const matchesFormat = regex ? regex.test(shaped) : true;

  let result: DocumentValidationResult = { outcome: "valid" };

  if (!matchesFormat) {
    if (tier === "strict") {
      result = { outcome: "reject", message: `This doesn't match the standard ${rule.country} ${documentLabel} format.` };
    } else if (tier === "warn") {
      result = {
        outcome: "warn",
        message: `This doesn't look like a standard ${rule.country} ${documentLabel} number — please double-check it against your document.`,
      };
    }
    // generic / state: structural checks already passed above; no further action.
  }

  if (result.outcome === "reject") return result;

  if (field === "national_id") {
    const checksumFn = NATIONAL_ID_CHECKSUMS[iso2.toUpperCase()];
    if (checksumFn && !checksumFn(normalized)) {
      return {
        outcome: "reject",
        message: "This number appears to contain a typing error. Please check each digit against your document.",
      };
    }
  }

  return result;
}
