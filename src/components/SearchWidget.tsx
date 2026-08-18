import { classifications } from "@/lib/data";

export default function SearchWidget({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/search"
      method="get"
      className={`w-full rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 ${
        compact ? "" : "lg:p-6"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 lg:col-span-2">
          <span className="text-xs font-medium text-midnight/60">Pickup Location</span>
          <input
            name="location"
            defaultValue="Jomo Kenyatta International Airport (JKIA)"
            className="rounded-md border border-line px-3 py-2 text-sm text-midnight focus:border-gold focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Pickup Date</span>
          <input
            type="date"
            name="pickup"
            className="rounded-md border border-line px-3 py-2 text-sm text-midnight focus:border-gold focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Return Date</span>
          <input
            type="date"
            name="return"
            className="rounded-md border border-line px-3 py-2 text-sm text-midnight focus:border-gold focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-midnight/60">Vehicle Type</span>
          <select
            name="classification"
            defaultValue=""
            className="rounded-md border border-line px-3 py-2 text-sm text-midnight focus:border-gold focus:outline-none"
          >
            <option value="">Any type</option>
            {classifications.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-md bg-gold px-6 py-3 text-sm font-semibold text-midnight shadow-sm transition hover:bg-gold-dark hover:text-white sm:w-auto"
      >
        Search Vehicles
      </button>
    </form>
  );
}
