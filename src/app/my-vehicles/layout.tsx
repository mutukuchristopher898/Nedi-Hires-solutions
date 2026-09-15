import { requireRole } from "@/lib/supabase/authz";

export default async function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["partner", "admin"], "/my-vehicles");
  return children;
}
