import Link from "next/link";
import { notFound } from "next/navigation";
import AccountActions from "@/components/admin/AccountActions";
import AccountLifecycleActions from "@/components/admin/AccountLifecycleActions";
import AuditChanges from "@/components/admin/AuditChanges";
import { requireRole } from "@/lib/supabase/authz";
import { getAccountDetail, getAuditLog } from "@/lib/supabase/queries";
import { formatMoney } from "@/lib/data";
import type { DocumentStatus } from "@/lib/types";

const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  pending: "bg-amber/10 text-amber ring-1 ring-amber/30",
  approved: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  rejected: "bg-red-500/10 text-red-600 ring-1 ring-red-500/30",
  returned: "bg-charcoal-soft/10 text-charcoal-soft ring-1 ring-charcoal-soft/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await requireRole(["staff", "admin"], "/admin/accounts");
  const { id } = await params;

  const account = await getAccountDetail(id);
  if (!account) notFound();

  const { entries } = await getAuditLog({ entityType: "profiles", entityId: id, limit: 10 });

  return (
    <div>
      <Link href="/admin/accounts" className="text-sm text-midnight/60 hover:text-gold">
        ← Back to accounts
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-midnight">{account.fullName}</h1>
          <p className="mt-1 text-sm text-midnight/60">
            {account.email ?? <span className="text-midnight/40">no email on file</span>}
            {account.phone ? ` · ${account.phone}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-midnight/40">
            {account.role} · joined {formatDate(account.createdAt)}
            {account.partnerName ? ` · ${account.partnerName}` : ""}
          </p>
        </div>
        <AccountActions account={account} isSelf={account.id === userId} />
      </div>

      {account.anonymisedAt && (
        <p className="mt-4 rounded-md bg-midnight/5 px-4 py-3 text-sm text-midnight/60">
          This account was erased on {formatWhen(account.anonymisedAt)}. Personal details and
          identity documents are gone; bookings are kept for the accounts.
        </p>
      )}
      {account.suspendedAt && !account.anonymisedAt && (
        <>
        <p className="mt-4 rounded-md bg-amber/10 px-4 py-3 text-sm text-amber">
          Suspended on {formatWhen(account.suspendedAt)}
          {account.suspensionReason ? ` — ${account.suspensionReason}` : ""}. Every write is
          refused: no bookings, enquiries, quote requests, vehicle listings, business
          registrations, document submissions or file uploads. Reading still works, so they can
          see a hire they already have.
        </p>
        <p className="mt-2 rounded-md bg-midnight/5 px-4 py-3 text-xs text-midnight/60">
          They can still sign in. Sign-in goes from the browser to Supabase Auth directly and
          never touches this application, so suspension cannot intercept it — what it does is
          make the account inert once they are in.
        </p>
        </>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Bookings" value={account.bookingCount} />
        <Stat label="Documents" value={account.documents.length} />
        <Stat label="Enquiries" value={account.enquiryCount} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Account actions</h2>
        <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-line">
          <AccountLifecycleActions
            id={account.id}
            fullName={account.fullName}
            email={account.email}
            suspendedAt={account.suspendedAt}
            anonymisedAt={account.anonymisedAt}
            isSelf={account.id === userId}
            canManage={role === "admin"}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Bookings</h2>
        {account.bookings.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">No bookings.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {account.bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 ring-1 ring-line">
                <div>
                  <p className="text-sm font-medium text-midnight">
                    {b.bookingRef} · {b.vehicleLabel}
                  </p>
                  <p className="text-xs text-midnight/60">
                    {formatDate(b.startDate)} – {formatDate(b.endDate)} ·{" "}
                    {formatMoney(b.totalAmount, b.currency)} · {b.status.replace(/_/g, " ")}
                  </p>
                </div>
                {b.holdsVehicle && (
                  <span className="rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold-dark ring-1 ring-gold/30">
                    Holding vehicle
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Identity documents</h2>
        {account.documents.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">No documents uploaded.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {account.documents.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 ring-1 ring-line">
                <div>
                  <p className="text-sm font-medium text-midnight">{d.docType}</p>
                  <p className="text-xs text-midnight/60">
                    {d.bookingRef ?? "No booking"} · submitted {formatDate(d.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${DOCUMENT_STATUS_STYLES[d.status]}`}>
                    {d.status === "returned" ? "returned" : d.status}
                  </span>
                  <Link href="/admin/documents" className="text-xs font-semibold text-gold-dark hover:text-gold">
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-midnight/40">
          Documents are previewed in the verification queue, where the signed links are issued.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-midnight">Recent activity</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-midnight/50">No staff changes recorded for this account.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-xs text-midnight/60">
                  {entry.actorEmail ?? "Unknown"} · {entry.action} · {formatWhen(entry.createdAt)}
                </p>
                <div className="mt-2">
                  <AuditChanges changes={entry.changes} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <p className="text-sm text-midnight/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-midnight">{value}</p>
    </div>
  );
}
