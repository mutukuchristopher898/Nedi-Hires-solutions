import VehicleCard from "@/components/VehicleCard";
import SearchWidget from "@/components/SearchWidget";
import { classifications, vehicles } from "@/lib/data";
import type { FuelType, Transmission, VehicleClassification } from "@/lib/types";

type SearchParams = {
  location?: string;
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

  const results = vehicles.filter((v) => {
    if (v.approvalStatus !== "approved") return false;
    if (classification && v.classification !== classification) return false;
    if (fuel && v.fuelType !== fuel) return false;
    if (transmission && v.transmission !== transmission) return false;
    return true;
  });

  return (
    <div className="bg-offwhite">
      <div className="bg-charcoal py-8">
        <div className="container-shell">
          <SearchWidget compact />
        </div>
      </div>

      <div className="container-shell grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <form className="space-y-6" method="get">
            {params.location && <input type="hidden" name="location" value={params.location} />}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-midnight">Vehicle Type</h3>
              <div className="space-y-1.5">
                <FilterLink label="Any type" href="/search" active={!classification} />
                {classifications.map((c) => (
                  <FilterLink
                    key={c}
                    label={c}
                    href={`/search?classification=${encodeURIComponent(c)}`}
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
          </form>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-midnight/60">
              {results.length} vehicle{results.length === 1 ? "" : "s"} available
              {params.location ? ` near ${params.location}` : ""}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-sm text-midnight/60 ring-1 ring-line">
              No vehicles match those filters yet. Try widening your search.
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

function buildHref(
  params: SearchParams,
  key: keyof SearchParams,
  value: string | undefined
) {
  const next = new URLSearchParams();
  for (const k of ["location", "classification", "fuel", "transmission"] as const) {
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
