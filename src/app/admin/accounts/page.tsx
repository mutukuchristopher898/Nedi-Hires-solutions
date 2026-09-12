import AccountActions from "@/components/admin/AccountActions";
import { requireRole } from "@/lib/supabase/authz";
import { getAdminAccounts } from "@/lib/supabase/queries";

const ROLE_STYLES: Record<string, string> = {
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
      <h1 className="text-2xl font-bold text-midnight">Accounts</h1>
      <p className="mt-1 text-sm text-midnight/60">
        Everyone who has signed up. Sending a reset link emails that person a link to set their
        own new password — you never see or choose it.
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
                    <h2 className="font-semibold text-midnight">{a.fullName}</h2>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLES[a.role]}`}>
                      {a.role}
                    </span>
                    {a.partnerName && (
                      <span className="text-xs text-midnight/50">{a.partnerName}</span>
                    )}
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
