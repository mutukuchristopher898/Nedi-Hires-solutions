// Checksum algorithms for the "strict" tier document numbers whose reference
// entry notes name a specific algorithm (spec §3.4). These catch a
// transposed/mistyped digit that a shape-only regex cannot.
//
// Caveat: the reference dataset's own `*_sample` values are illustrative —
// they are not guaranteed to satisfy the checksum below, and don't need to
// (they're already rejected separately as known placeholder values, see
// countryReference.getSampleValueBlacklist). These implementations follow
// each algorithm's published public specification, verified against
// well-known textbook test vectors (e.g. Luhn against standard card test
// numbers, Verhoeff against its canonical worked example).

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function luhnValid(value: string): boolean {
  const digits = onlyDigits(value);
  if (!digits) return false;
  let sum = 0;
  const reversed = [...digits].reverse().map(Number);
  reversed.forEach((d, i) => {
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  });
  return sum % 10 === 0;
}

// Netherlands BSN "11-proef": 9 digits, weights 9..2, subtract the last digit.
export function dutchBsnValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 9) return false;
  const n = [...d].map(Number);
  const sum = 9 * n[0] + 8 * n[1] + 7 * n[2] + 6 * n[3] + 5 * n[4] + 4 * n[5] + 3 * n[6] + 2 * n[7] - 1 * n[8];
  return sum % 11 === 0;
}

// Norway fødselsnummer: 11 digits, two check digits with published weight vectors.
export function norwayFodselsnummerValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  const n = [...d].map(Number);
  const w1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  const w2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  let s1 = 0;
  for (let i = 0; i < 9; i++) s1 += w1[i] * n[i];
  let k1 = 11 - (s1 % 11);
  if (k1 === 11) k1 = 0;
  if (k1 === 10 || k1 !== n[9]) return false;

  let s2 = 0;
  for (let i = 0; i < 10; i++) s2 += w2[i] * n[i];
  let k2 = 11 - (s2 % 11);
  if (k2 === 11) k2 = 0;
  if (k2 === 10) return false;
  return k2 === n[10];
}

// Czechia/Slovakia rodné číslo (post-1954): 10 digits, mod 11 over the first 9.
export function czechRodneCisloValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 10) return false;
  const first9 = BigInt(d.slice(0, 9));
  const remainder = first9 % BigInt(11);
  const expected = remainder === BigInt(10) ? BigInt(0) : remainder;
  return Number(expected) === Number(d[9]);
}

// Croatia OIB: ISO 7064 MOD 11,10 recursive check over 11 digits.
export function croatiaOibValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  let p = 10;
  for (let i = 0; i < 10; i++) {
    p = (p + Number(d[i])) % 10;
    if (p === 0) p = 10;
    p = (p * 2) % 11;
  }
  const check = (11 - p) % 10;
  return check === Number(d[10]);
}

// Turkey T.C. Kimlik No: 11 digits, two computed check digits.
export function turkeyKimlikValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  const n = [...d].map(Number);
  const oddSum = n[0] + n[2] + n[4] + n[6] + n[8];
  const evenSum = n[1] + n[3] + n[5] + n[7];
  const d10 = (((oddSum * 7 - evenSum) % 10) + 10) % 10;
  if (d10 !== n[9]) return false;
  const sumFirst10 = n.slice(0, 10).reduce((a, b) => a + b, 0);
  return sumFirst10 % 10 === n[10];
}

// Spain DNI/NIE: control letter = number mod 23, looked up in a fixed table.
const SPAIN_LETTER_TABLE = "TRWAGMYFPDXBNJZSQVHLCKE";

export function spainDniNieValid(value: string): boolean {
  const v = value.trim().toUpperCase().replace(/[\s-]/g, "");
  const match = v.match(/^([0-9XYZ])(\d{7})([A-Z])$/);
  if (!match) return false;
  const leadMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const lead = leadMap[match[1]] ?? match[1];
  const numberPart = Number(lead + match[2]);
  return SPAIN_LETTER_TABLE[numberPart % 23] === match[3];
}

// France INSEE/NIR: 13-digit base + 2-digit key, key = 97 - (base13 mod 97).
// Corsica department codes (2A/2B) are alphabetic and must be normalised to
// 19/18 by the caller before this runs — this function expects pure digits.
export function franceInseeValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 15) return false;
  const base13 = d.slice(0, 13);
  const key = Number(d.slice(13, 15));
  const computed = 97 - Number(BigInt(base13) % BigInt(97));
  return computed === key;
}

// Belgium Rijksregisternummer/NISS: mod 97, ambiguous 2-digit birth year
// means both the pre-2000 and post-2000 bases must be checked.
export function belgiumNissValid(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  const base9 = d.slice(0, 9);
  const key = Number(d.slice(9, 11));
  const checkPre2000 = 97 - Number(BigInt(base9) % BigInt(97));
  const checkPost2000 = 97 - Number((BigInt(2000000000) + BigInt(base9)) % BigInt(97));
  return key === checkPre2000 || key === checkPost2000;
}

// Verhoeff algorithm (India Aadhaar): dihedral-group D5 tables, order-independent
// of position weighting quirks that trip up naive mod-11 reimplementations.
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function verhoeffValid(value: string): boolean {
  const d = onlyDigits(value);
  if (!d) return false;
  let c = 0;
  const reversed = [...d].reverse().map(Number);
  reversed.forEach((digit, i) => {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  });
  return c === 0;
}

// China Resident ID (GB 11643-1999): ISO 7064 MOD 11-2 over 17 digits, final
// character may be 'X'.
const CHINA_CHECK_MAP = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
const CHINA_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

export function chinaResidentIdValid(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (!/^\d{17}[0-9X]$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += Number(v[i]) * CHINA_WEIGHTS[i];
  return v[17] === CHINA_CHECK_MAP[sum % 11];
}

// Maps iso2 + document field to the checksum function that applies — only
// populated where the reference file's own notes explicitly name a checksum.
// A country/document combination absent from this table simply isn't
// checksum-verified (regex + universal structural checks still apply).
type ChecksumFn = (value: string) => boolean;

export const NATIONAL_ID_CHECKSUMS: Record<string, ChecksumFn> = {
  CA: luhnValid,
  ZA: luhnValid,
  AE: luhnValid,
  IL: luhnValid,
  NL: dutchBsnValid,
  NO: norwayFodselsnummerValid,
  CZ: czechRodneCisloValid,
  HR: croatiaOibValid,
  TR: turkeyKimlikValid,
  ES: spainDniNieValid,
  FR: franceInseeValid,
  BE: belgiumNissValid,
  IN: verhoeffValid,
  CN: chinaResidentIdValid,
};
