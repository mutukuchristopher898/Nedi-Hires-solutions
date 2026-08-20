import type { NameOrder } from "./countryReference";

// spec §2.1 — reject these as the *entire* value of a name field (case-insensitive).
const KEYBOARD_MASH = new Set(["asdf", "qwer", "zxcv", "1234", "test", "aaa", "xxx", "abc"]);

// Unicode letters/marks, spaces, apostrophes (straight + curly), hyphens, periods.
const NAME_CHAR_REGEX = /^\p{L}[\p{L}\p{M}\s'’.-]{1,49}$/u;

export function validateNamePart(rawValue: string, fieldLabel: string): { valid: boolean; message?: string } {
  const value = rawValue.trim();

  if (value.length < 2) {
    return { valid: false, message: `${fieldLabel} must be at least 2 characters.` };
  }
  if (value.length > 50) {
    return { valid: false, message: `${fieldLabel} must be 50 characters or fewer.` };
  }
  if (!NAME_CHAR_REGEX.test(value)) {
    return { valid: false, message: `${fieldLabel} can only contain letters, spaces, apostrophes, hyphens, and periods.` };
  }
  if (/(.)\1{2,}/u.test(value)) {
    return { valid: false, message: `${fieldLabel} doesn't look right — please check for a repeated-letter typo.` };
  }
  if (/^(.)\1*$/iu.test(value.replace(/\s/g, ""))) {
    return { valid: false, message: `${fieldLabel} can't be a single letter repeated.` };
  }
  if (KEYBOARD_MASH.has(value.toLowerCase())) {
    return { valid: false, message: `${fieldLabel} looks like a placeholder value, not a real name.` };
  }
  return { valid: true };
}

export function namesAreDuplicate(surname: string, givenNames: string): boolean {
  return surname.trim().toLowerCase() === givenNames.trim().toLowerCase();
}

// The passport MRZ is always SURNAME<<GIVEN<NAMES regardless of local
// display order (spec §2.2) — this is what gets stored in full_name and
// compared against the guarantor for the guarantor-not-self guard.
export function composeFullName(surname: string, givenNames: string, middleName: string): string {
  const given = [givenNames.trim(), middleName.trim()].filter(Boolean).join(" ");
  return `${surname.trim().toUpperCase()}, ${given}`;
}

export interface NameFieldSlot {
  key: "surname" | "givenNames" | "middleName" | "grandfatherName";
  label: string;
  required: boolean;
}

// Display order/labels only — the stored columns (surname/given_names/middle_name)
// never change based on this (spec §2.2). The Arabic given-father-grandfather-family
// layout has 4 UI slots but only 3 storage columns: grandfatherName is UI-only
// transient state, joined into middleName as "father grandfather" at submit time.
export function getNameOrderLayout(nameOrder: NameOrder): NameFieldSlot[] {
  switch (nameOrder) {
    case "family-first":
      return [
        { key: "surname", label: "Family name", required: true },
        { key: "givenNames", label: "Given name(s)", required: true },
      ];
    case "given-patronymic-family":
      return [
        { key: "givenNames", label: "Given name(s)", required: true },
        { key: "middleName", label: "Patronymic / middle name", required: false },
        { key: "surname", label: "Family name", required: true },
      ];
    case "given-father-grandfather-family":
      return [
        { key: "givenNames", label: "Given name", required: true },
        { key: "middleName", label: "Father's name", required: true },
        { key: "grandfatherName", label: "Grandfather's name (optional)", required: false },
        { key: "surname", label: "Family name", required: true },
      ];
    case "given-first":
    default:
      return [
        { key: "givenNames", label: "Given name(s)", required: true },
        { key: "middleName", label: "Middle name (optional)", required: false },
        { key: "surname", label: "Family name", required: true },
      ];
  }
}
