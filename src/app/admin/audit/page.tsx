import Link from "next/link";
import AuditChanges from "@/components/admin/AuditChanges";
import { getAuditLog } from "@/lib/supabase/queries";

const ENTITY_FILTERS = [
  "vehicles",
  "profiles",
  "bookings",
  "partners",
  "identity_documents",
  "contact_messages",
  "quote_requests",
  "pricing_settings",
  "one_way_fees",
] as const;

const ACTION_STYLES: Record<string, string> = {
  insert: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  update: "bg-amber/10 text-amber ring-1 ring-amber/30",
  delete: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Validated rather than trusted: an unrecognised entity is ignored, not
  // passed to the query.
  const entityType = ENTITY_FILTERS.includes(params.entity as (typeof ENTITY_FILTERS)[number])
    ? params.entity
    : undefined;

  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 200) : 1;

  const { entries, total } = await getAuditLog({ entityType, page });
  const lastPage = Math.max(Math.ceil(total / 50), 1);

  const hrefFor = (entity?: string, nextPage = 1) => {
    const qs = new URLSearchParams();
    if (entity) qs.set("entity", entity);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const query = qs.toString();
    return query ? `/admin/audit?${query}` : "/admin/audit";
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-midnight">Activity Log</h1>
        <a
          href={`/api/admin/export?entity=audit${entityType ? `&entityType=${entityType}` : ""}`}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
        >
          Export CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        Every change made by staff or an admin, with what moved and who moved it. Written by the
        database itself — entries cannot be edited or removed from here, deliberately.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <FilterChip label="Everything" href={hrefFor(undefined)} active={!entityType} />
        {ENTITY_FILTERS.map((entity) => (
          <FilterChip
            key={entity}
            label={entity.replace(/_/g, " ")}
            href={hrefFor(entity)}
            active={entityType === entity}
          />
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">
            {entityType ? "No activity recorded for this yet." : "No admin activity recorded yet."}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">
            {total} entr{total === 1 ? "y" : "ies"}
            {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ""}
          </p>

          <div className="mt-4 space-y-3">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ACTION_STYLES[entry.action] ?? ""}`}>
                    {entry.action}
                  </span>
                  <span className="text-sm font-semibold text-midnight">
                    {entry.entityType.replace(/_/g, " ")}
                  </span>
                  {entry.entityId && (
                    <span className="font-mono text-xs text-midnight/40">
                      {entry.entityId.slice(0, 8)}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-midnight/50">{formatWhen(entry.createdAt)}</span>
                </div>

                <p className="mt-1 text-xs text-midnight/60">
                  {entry.actorEmail ?? "Unknown actor"}
                  {entry.actorRole ? ` · ${entry.actorRole}` : ""}
                </p>

                <div className="mt-3 border-t border-line pt-3">
                  <AuditChanges changes={entry.changes} />
                </div>
              </article>
            ))}
          </div>

          {lastPage > 1 && (
            <nav aria-label="Activity log pages" className="mt-6 flex items-center justify-between gap-4">
              {page > 1 ? (
                <Link href={hrefFor(entityType, page - 1)} rel="prev" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5">
                  ← Previous
                </Link>
              ) : <span />}
              <p className="text-sm text-midnight/60">Page {page} of {lastPage}</p>
              {page < lastPage ? (
                <Link href={hrefFor(entityType, page + 1)} rel="next" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5">
                  Next →
                </Link>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
        active ? "bg-gold text-midnight" : "bg-white text-midnight/60 ring-1 ring-line hover:bg-midnight/5"
      }`}
    >
      {label}
    </Link>
  );
}
