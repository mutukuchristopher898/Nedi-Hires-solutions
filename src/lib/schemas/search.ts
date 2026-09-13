import { z } from "zod";
import { classifications } from "@/lib/data";

// One schema, imported by the search page (server) and the search widget
// (client), so the two can never drift apart.
//
// Everything here coerces, clamps, then falls back — it never throws. A search
// URL is the most exposed surface on the site and is routinely mangled by
// people editing it, by stale links and by crawlers. A bad `page` should show
// page one, not a 500.

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"] as const;
export const TRANSMISSIONS = ["Automatic", "Manual"] as const;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "year_desc"] as const;

/** Fixed set, so `limit=999999` cannot be used to pull the whole inventory. */
export const PAGE_SIZES = [12, 24, 48] as const;
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE = 500;

/** Hard ceiling applied in the query layer regardless of what `limit` asks for. */
export const ABSOLUTE_RESULT_CAP = 48;

export type SortOption = (typeof SORT_OPTIONS)[number];

// Matches C0 and C7F control characters, which have no business in a filter
// value and can corrupt logs and headers downstream.
const CONTROL_CHARACTERS = /[\p{Cc}]/gu;

// `.catch()` is what makes each field independently forgiving: one unparseable
// value falls back on its own instead of failing the whole parse.
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values).optional().catch(undefined);

export const searchParamsSchema = z.object({
  // Free text, so bounded, trimmed and stripped before it reaches a filter.
  location: z
    .string()
    .transform((v) => v.replace(CONTROL_CHARACTERS, "").trim())
    .pipe(z.string().max(120))
    .optional()
    .catch(undefined),

  classification: optionalEnum(classifications),
  fuel: optionalEnum(FUEL_TYPES),
  transmission: optionalEnum(TRANSMISSIONS),

  // Echoed back into the form rather than queried, but still bounded so a
  // crafted value cannot be reflected into the page at arbitrary length.
  pickup: z.string().max(40).optional().catch(undefined),
  return: z.string().max(40).optional().catch(undefined),

  // Coerce, fall back, then clamp — in that order, because the two failures
  // are different. "abc" is not a page number and falls back to the first.
  // 99999 *is* a page number, just past the end, so it clamps to the ceiling
  // and yields an empty page rather than silently showing page one.
  page: z.coerce.number().int().min(1).catch(1).transform((n) => Math.min(n, MAX_PAGE)),

  limit: z.coerce
    .number()
    .int()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .catch(DEFAULT_PAGE_SIZE),

  sort: z.enum(SORT_OPTIONS).catch("newest"),
});

export type SearchParamsInput = Record<string, string | string[] | undefined>;
export type ParsedSearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Parses whatever arrived in the URL. Repeated params (`?page=1&page=2`) arrive
 * as arrays; the first value wins rather than the parse failing. Unknown keys
 * are dropped by the schema, so nothing unexpected reaches the query layer.
 */
export function parseSearchParams(raw: SearchParamsInput): ParsedSearchParams {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return searchParamsSchema.parse(flat);
}
