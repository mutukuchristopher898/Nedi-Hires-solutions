import { requireAuth } from "@/lib/supabase/authz";

export default async function PartnerOnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/partners/onboarding");
  return children;
}
