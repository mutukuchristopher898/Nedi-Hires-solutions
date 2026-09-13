import Link from "next/link";
import { requireRole } from "@/lib/supabase/authz";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/approvals", label: "Unit Approval Queue" },
  { href: "/admin/documents", label: "Document Verification" },
  { href: "/admin/quotes", label: "Partner Quote Requests" },
  { href: "/admin/messages", label: "Contact Enquiries" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/audit", label: "Activity Log" },
  { href: "/admin/pricing", label: "Pricing & Fees" },
  { href: "/admin/pricing/vehicles", label: "Per-vehicle Pricing" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Staff get the admin area too. What they may do inside it is governed by
  // is_staff()/is_admin() in the database, not by this guard.
  await requireRole(["staff", "admin"], "/admin");

  return (
    <div className="bg-offwhite">
      <div className="border-b border-line bg-white">
        <div className="container-shell flex flex-wrap gap-1 py-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-midnight/70 transition hover:bg-midnight/5 hover:text-midnight"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="container-shell py-10">{children}</div>
    </div>
  );
}
