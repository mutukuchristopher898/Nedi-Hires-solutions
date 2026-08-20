// Typed access to the 240-country/territory document & phone reference
// dataset. Keys are kept snake_case, matching the source file and this
// codebase's convention of mirroring Supabase's own column naming rather
// than introducing a camelCase translation layer that could drift or typo.

import raw from "./countryReference.json";

export type DocumentTier = "strict" | "warn" | "generic" | "state";

export type NameOrder =
  | "given-first"
  | "family-first"
  | "given-patronymic-family"
  | "given-father-grandfather-family";

export type YesNo = "yes" | "no";

export interface CountryDocumentRule {
  country: string;
  iso3: string;
  calling_code: string;
  phone_sample: string;
  phone_nsn_digits: number;
  passport_regex: string;
  passport_sample: string;
  passport_tier: DocumentTier;
  passport_notes: string;
  national_id_name: string;
  national_id_regex: string;
  national_id_sample: string;
  national_id_tier: DocumentTier;
  national_id_notes: string;
  driving_licence_name: string;
  driving_licence_regex: string;
  driving_licence_sample: string;
  driving_licence_tier: DocumentTier;
  driving_licence_notes: string;
  name_order: NameOrder;
  mononym_allowed: YesNo;
  latin_script_document: YesNo;
  idp_recommended: YesNo;
}

const REFERENCE = raw as unknown as Record<string, CountryDocumentRule>;

export function getCountryRule(iso2: string): CountryDocumentRule | null {
  return REFERENCE[iso2.trim().toUpperCase()] ?? null;
}

export function getAllCountriesForSelect(): { iso2: string; name: string }[] {
  return Object.entries(REFERENCE)
    .map(([iso2, rule]) => ({ iso2, name: rule.country }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isValidIso2(iso2: string): boolean {
  return /^[A-Z]{2}$/.test(iso2.trim().toUpperCase()) && REFERENCE[iso2.trim().toUpperCase()] !== undefined;
}

// A country/document's own *_sample value is exactly what a customer would
// copy-paste from the reference data if they ever saw it — build a
// blacklist of every sample automatically instead of hand-maintaining one.
let sampleBlacklist: Set<string> | null = null;

export function getSampleValueBlacklist(): Set<string> {
  if (sampleBlacklist) return sampleBlacklist;
  const set = new Set<string>();
  for (const rule of Object.values(REFERENCE)) {
    for (const sample of [rule.passport_sample, rule.national_id_sample, rule.driving_licence_sample]) {
      if (sample) set.add(normalizeDocumentNumber(sample));
    }
  }
  sampleBlacklist = set;
  return set;
}

export function normalizeDocumentNumber(value: string): string {
  return value.trim().toUpperCase().replace(/[\s\-./]/g, "");
}
