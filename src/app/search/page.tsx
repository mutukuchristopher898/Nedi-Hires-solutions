import type { Metadata } from "next";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import SearchWidget from "@/components/SearchWidget";
import { classifications, formatClassification } from "@/lib/data";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import {
  DEFAULT_PAGE_SIZE,
  parseSearchParams,
  type ParsedSearchParams,
} from "@/lib/schemas/search";

export const metadata: Metadata = {
  title: "Book a Car",
  description: "Search verified self drive and chauffeur driven vehicles across Kenya, filter by location, dates, vehicle type, fuel and transmission.",
  alternates: { canonical: "/search" },
  openGraph: { title: "Book a Car", description: "Search verified self drive and chauffeur driven vehicles across Kenya, filter by location, dates, vehicle type, fuel and transmission.", url: "/search" },
};

type SearchParams = {
  location?: string;
  pickup?: string;
  return?: string;
  classification?: string;
  fuel?: string;
  transmission?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;

  // Validated, clamped and defaulted before anything touches the database.
  // Nothing here throws: a mangled URL falls back rather than erroring.
  const params = parseSearchParams(raw);
  const { location, classification, fuel, transmission, page, limit, sort } = params;

  // Any filter at all means the customer has run a search — the form collapses
  // and the page leads with results rather than chrome. Deliberately ignores
  // page/limit/sort, which are navigation rather than a search.
  const hasSearched = Boolean(location || classification || fuel || transmission || params.pickup || params.return);

  // Approved vehicles, filtered in the database. This is live inventory now:
  // what a partner lists and an admin approves appears here.
  const { vehicles: results, total } = await getApprovedVehicles({
    location,
    classification,
    fuelType: fuel,
    transmission,
    page,
    limit,
    sort,
  });

  const lastPage = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="bg-offwhite">
      <div className={hasSearched ? "bg-charcoal py-5" : "bg-charcoal py-10"}>
        <div className="container-shell">
          {!hasSearched && (
            <>
              <h1 className="text-2xl font-bold text-white">Find your vehicle</h1>
              <p className="mt-1 mb-6 text-sm text-white/60">
                Tell us where and when, and we&apos;ll show you what&apos;s available.
              </p>
            </>
          )}
          <SearchWidget
            collapsible={hasSearched}
            initial={{
              location: params.location,
              pickup: params.pickup,
              return: params.return,
              classification: params.classification,
              transmission: params.transmission,
            }}
          />
        </div>
      </div>

      <div className="container-shell grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-midnight">Vehicle Type</h3>
            <div className="space-y-1.5">
              <FilterLink label="Any type" href={buildHref(params, "classification", undefined)} active={!classification} />
              {classifications.map((c) => (
                <FilterLink
                  key={c}
                  label={formatClassification(c)}
                  href={buildHref(params, "classification", c)}
                  active={classification === c}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-midnight">Transmission</h3>
            <div className="space-y-1.5">
              <FilterLink label="Any" href={buildHref(params, "transmission", undefined)} active={!transmission} />
              <FilterLink
                label="Automatic"
                href={buildHref(params, "transmission", "Automatic")}
                active={transmission === "Automatic"}
              />
              <FilterLink
                label="Manual"
                href={buildHref(params, "transmission", "Manual")}
                active={transmission === "Manual"}
              />
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-midnight/60">
              {total} vehicle{total === 1 ? "" : "s"} available
              {location ? ` at ${location}` : ""}
              {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ""}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center ring-1 ring-line">
              <p className="text-sm text-midnight/60">
                {/* Past the last page is not the same as no inventory, saying
                    "none listed" there would be plainly false. */}
                {page > 1
                  ? "There are no vehicles on this page."
                  : hasSearched
                    ? "Nothing available for those dates in this category. Try shifting your dates by a day, or message us on WhatsApp, we often have partner vehicles that aren't listed yet."
                    : "No vehicles are listed yet."}
              </p>
              {page > 1 ? (
                <Link
                  href={buildHref(params, "page", 1)}
                  className="mt-3 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
                >
                  Back to the first page
                </Link>
              ) : (
                <Link
                  href="/partners/onboarding"
                  className="mt-3 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
                >
                  Have a vehicle to hire out? List it &rarr;
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>

              {lastPage > 1 && (
                <nav aria-label="Search results pages" className="mt-8 flex items-center justify-between gap-4">
                  {page > 1 ? (
                    <Link
                      href={buildHref(params, "page", page - 1)}
                      rel="prev"
                      className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  <p className="text-sm text-midnight/60">
                    Page {page} of {lastPage}
                  </p>

                  {page < lastPage ? (
                    <Link
                      href={buildHref(params, "page", page + 1)}
                      rel="next"
                      className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Built from the parsed params, not the raw ones, so a link never carries a
// value the schema already rejected.
function buildHref(
  params: ParsedSearchParams,
  key: keyof ParsedSearchParams,
  value: string | number | undefined
) {
  const next = new URLSearchParams();

  for (const k of ["location", "pickup", "return", "classification", "fuel", "transmission"] as const) {
    const v = k === key ? value : params[k];
    if (v) next.set(k, String(v));
  }

  // Changing a filter returns to page one — staying on page 7 of a narrower
  // result set is how people land on an empty page.
  const page = key === "page" ? value : 1;
  if (page && Number(page) > 1) next.set("page", String(page));

  const sort = key === "sort" ? value : params.sort;
  if (sort && sort !== "newest") next.set("sort", String(sort));

  const limit = key === "limit" ? value : params.limit;
  if (limit && Number(limit) !== DEFAULT_PAGE_SIZE) next.set("limit", String(limit));

  const qs = next.toString();
  return qs ? `/search?${qs}` : "/search";
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`block rounded-md px-3 py-1.5 text-sm transition ${
        active
          ? "bg-gold/10 font-medium text-gold-dark"
          : "text-midnight/70 hover:bg-midnight/5"
      }`}
    >
      {label}
    </a>
  );
}
