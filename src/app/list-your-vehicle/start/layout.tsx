import { requireAuth } from "@/lib/supabase/authz";

export default async function OwnerOnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/list-your-vehicle/start");
  return children;
}
