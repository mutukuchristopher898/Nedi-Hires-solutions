import { requireRole } from "@/lib/supabase/authz";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["partner", "admin"], "/partners/dashboard");
  return children;
}
