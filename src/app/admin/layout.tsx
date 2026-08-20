import Link from "next/link";
import { requireRole } from "@/lib/supabase/authz";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/approvals", label: "Unit Approval Queue" },
  { href: "/admin/documents", label: "Document Verification" },
  { href: "/admin/quotes", label: "Partner Quote Requests" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"], "/admin");

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
