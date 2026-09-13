import Image from "next/image";
import Link from "next/link";
import VehicleLifecycleActions from "@/components/admin/VehicleLifecycleActions";
import { requireRole } from "@/lib/supabase/authz";
import { getAdminVehicles, getVehiclePartnerNames, getVehicleLocations, getOptions } from "@/lib/supabase/queries";
import { publicVehiclePhotoUrl } from "@/lib/supabase/vehiclePhotos";
import { formatMoney, classifications } from "@/lib/data";
import type { VehicleLifecycle } from "@/lib/supabase/queries";

const LIFECYCLES: VehicleLifecycle[] = ["pending", "live", "hidden", "rejected", "archived"];

const LIFECYCLE_STYLES: Record<VehicleLifecycle, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  live: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  hidden: "bg-midnight/5 text-midnight/60 ring-1 ring-midnight/10",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  archived: "bg-midnight/5 text-midnight/40 ring-1 ring-midnight/10",
};

type Params = {
  status?: string;
  partner?: string;
  location?: string;
  class?: string;
  q?: string;
  page?: string;
};

export default async function AdminVehiclesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { role } = await requireRole(["staff", "admin"], "/admin/vehicles");
  const raw = await searchParams;

  // Validated, not trusted — an unrecognised filter is ignored rather than
  // passed through to the query.
  const lifecycle = LIFECYCLES.includes(raw.status as VehicleLifecycle)
    ? (raw.status as VehicleLifecycle)
    : undefined;
  const classification = classifications.includes(raw.class as (typeof classifications)[number])
    ? raw.class
    : undefined;
  const parsedPage = Number(raw.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 200) : 1;
  const search = (raw.q ?? "").slice(0, 80).trim() || undefined;

  const [{ vehicles, total }, partners, locations, rejectionReasons] = await Promise.all([
    getAdminVehicles({
      lifecycle,
      partnerName: raw.partner,
      location: raw.location,
      classification,
      search,
      page,
    }),
    getVehiclePartnerNames(),
    getVehicleLocations(),
    getOptions("vehicle_rejection_reason"),
  ]);

  const lastPage = Math.max(Math.ceil(total / 25), 1);

  const pageHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      if (value && key !== "page") qs.set(key, String(value));
    }
    if (nextPage > 1) qs.set("page", String(nextPage));
    const query = qs.toString();
    return query ? `/admin/vehicles?${query}` : "/admin/vehicles";
  };

  const hasFilters = Boolean(raw.q || raw.status || raw.partner || raw.location || raw.class);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-midnight">Vehicles</h1>
        <Link
          href="/admin/vehicles/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-gold-dark hover:text-white"
        >
          Add a vehicle
        </Link>
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        Every vehicle on the platform. Hiding removes one from search immediately and is
        reversible; archiving takes it out of the fleet for good while keeping the bookings that
        reference it.
      </p>

      {/* A plain GET form, so every filter combination is a shareable URL and
          the back button behaves. */}
      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={raw.q ?? ""}
          placeholder="Registration, make or model"
          maxLength={80}
          aria-label="Search vehicles"
          className="w-56 rounded-md border border-line px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <FilterSelect name="status" label="Any status" value={raw.status} options={LIFECYCLES} />
        <FilterSelect name="partner" label="Any partner" value={raw.partner} options={partners} />
        <FilterSelect name="location" label="Any location" value={raw.location} options={locations} />
        <FilterSelect name="class" label="Any class" value={raw.class} options={[...classifications]} />
        <button
          type="submit"
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
        >
          Apply
        </button>
        {hasFilters && (
          <Link href="/admin/vehicles" className="self-center text-sm font-medium text-gold-dark hover:text-gold">
            Clear
          </Link>
        )}
      </form>

      {vehicles.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">
            {total === 0 && page === 1
              ? "No vehicles match those filters."
              : "No vehicles on this page."}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {total} vehicle{total === 1 ? "" : "s"}
            {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ""}
          </p>

          <div className="mt-4 space-y-3">
            {vehicles.map((v) => (
              <article key={v.id} className="flex flex-wrap gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
                {v.photoPaths.length > 0 ? (
                  <Image
                    src={publicVehiclePhotoUrl(v.photoPaths[0])}
                    alt=""
                    width={128}
                    height={96}
                    className="h-24 w-32 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-midnight/5 text-xs text-midnight/40">
                    No photo
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/vehicles/${v.id}`}
                      className="font-semibold text-midnight hover:text-gold-dark"
                    >
                      {v.make} {v.model} {v.year}
                    </Link>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${LIFECYCLE_STYLES[v.lifecycle]}`}
                    >
                      {v.lifecycle}
                    </span>
                    {v.isDemo && (
                      <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">
                        illustrative
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-midnight/60">
                    {v.licensePlate} · {v.classification} · {v.transmission} · {v.location}
                  </p>
                  <p className="mt-1 text-sm text-midnight/70">
                    {v.partnerName ?? <span className="text-midnight/40">No partner</span>} ·{" "}
                    <span className="font-medium text-midnight">
                      {formatMoney(v.pricePerDay, v.currency)}/day
                    </span>
                  </p>
                  {v.rejectionReason && (
                    <p className="mt-2 rounded-md bg-red-500/5 px-2 py-1 text-xs text-red-600">
                      Rejected: {v.rejectionReason}
                    </p>
                  )}
                </div>

                <VehicleLifecycleActions
                  id={v.id}
                  label={`${v.make} ${v.model}`}
                  lifecycle={v.lifecycle}
                  hasPhoto={v.photoPaths.length > 0}
                  canManage={role === "admin"}
                  rejectionReasons={rejectionReasons}
                />
              </article>
            ))}
          </div>

          {lastPage > 1 && (
            <nav aria-label="Vehicle pages" className="mt-6 flex items-center justify-between gap-4">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
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
                  href={pageHref(page + 1)}
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
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string;
  options: readonly string[];
}) {
  return (
    <select
      name={name}
      defaultValue={value ?? ""}
      aria-label={label}
      className="rounded-md border border-line bg-white px-3 py-2 text-sm capitalize focus:border-gold focus:outline-none"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
