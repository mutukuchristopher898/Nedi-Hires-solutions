import Link from "next/link";
import AccountActions from "@/components/admin/AccountActions";
import { requireRole } from "@/lib/supabase/authz";
import { getAdminAccounts } from "@/lib/supabase/queries";

const ROLE_STYLES: Record<string, string> = {
  staff: "bg-charcoal-soft/10 text-charcoal-soft ring-1 ring-charcoal-soft/30",
  admin: "bg-gold/10 text-gold-dark ring-1 ring-gold/30",
  partner: "bg-emerald/10 text-emerald-dark ring-1 ring-emerald/30",
  customer: "bg-midnight/5 text-midnight/60 ring-1 ring-midnight/10",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminAccountsPage() {
  // Also gives us the caller's own id, so the page can stop them changing
  // their own role and locking themselves out of the admin area.
  const { userId } = await requireRole(["admin"], "/admin/accounts");
  const accounts = await getAdminAccounts();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-midnight">Accounts</h1>
        <a
          href="/api/admin/export?entity=accounts"
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-midnight transition hover:bg-midnight/5"
        >
          Export CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-midnight/60">
        Everyone who has signed up. Sending a reset link emails that person a link to set their
        own new password, you never see or choose it.
      </p>

      {accounts.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-line">
          <p className="text-sm text-midnight/60">No accounts yet.</p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-midnight/60">{accounts.length} accounts</p>

          <div className="mt-4 space-y-3">
            {accounts.map((a) => (
              <article key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/accounts/${a.id}`} className="font-semibold text-midnight hover:text-gold-dark">
                      {a.fullName}
                    </Link>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLES[a.role]}`}>
                      {a.role}
                    </span>
                    {a.partnerName && (
                      <span className="text-xs text-midnight/50">{a.partnerName}</span>
                    )}
                    {a.anonymisedAt ? (
                      <span className="rounded-full bg-midnight/5 px-2.5 py-1 text-xs font-medium text-midnight/50 ring-1 ring-midnight/10">
                        erased
                      </span>
                    ) : a.suspendedAt ? (
                      <span className="rounded-full bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber ring-1 ring-amber/30">
                        suspended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-midnight/60">
                    {a.email ?? <span className="text-midnight/40">no email on file</span>}
                    {a.phone ? ` · ${a.phone}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-midnight/40">
                    Joined {formatDate(a.createdAt)} ·{" "}
                    {a.bookingCount === 0
                      ? "no bookings"
                      : `${a.bookingCount} booking${a.bookingCount === 1 ? "" : "s"}`}
                  </p>
                </div>

                <AccountActions account={a} isSelf={a.id === userId} />
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
