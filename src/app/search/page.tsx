import type { Metadata } from "next";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import SearchWidget from "@/components/SearchWidget";
import { classifications } from "@/lib/data";
import { getApprovedVehicles } from "@/lib/supabase/queries";
import type { FuelType, Transmission, VehicleClassification } from "@/lib/types";

export const metadata: Metadata = {
  title: "Book a Car",
  description: "Search verified self-drive and chauffeur-driven vehicles across Kenya — filter by location, dates, vehicle type, fuel and transmission.",
  alternates: { canonical: "/search" },
  openGraph: { title: "Book a Car", description: "Search verified self-drive and chauffeur-driven vehicles across Kenya — filter by location, dates, vehicle type, fuel and transmission.", url: "/search" },
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
  const params = await searchParams;
  const classification = params.classification as VehicleClassification | undefined;
  const fuel = params.fuel as FuelType | undefined;
  const transmission = params.transmission as Transmission | undefined;
  const location = params.location;

  // Any parameter at all means the customer has run a search — the form
  // collapses and the page leads with results rather than chrome.
  const hasSearched = Object.values(params).some(Boolean);

  // Approved vehicles, filtered in the database. This is live inventory now:
  // what a partner lists and an admin approves appears here.
  const results = await getApprovedVehicles({ location, classification, fuelType: fuel, transmission });

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
                  label={c}
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
              {results.length} vehicle{results.length === 1 ? "" : "s"} available
              {location ? ` at ${location}` : ""}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center ring-1 ring-line">
              <p className="text-sm text-midnight/60">
                {hasSearched
                  ? "No vehicles match those filters. Try widening your search."
                  : "No vehicles are listed yet."}
              </p>
              <Link
                href="/partners/onboarding"
                className="mt-3 inline-block text-sm font-semibold text-gold-dark hover:text-gold"
              >
                Have a vehicle to hire out? List it &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildHref(params: SearchParams, key: keyof SearchParams, value: string | undefined) {
  const next = new URLSearchParams();
  for (const k of ["location", "pickup", "return", "classification", "fuel", "transmission"] as const) {
    const v = k === key ? value : params[k];
    if (v) next.set(k, v);
  }
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
