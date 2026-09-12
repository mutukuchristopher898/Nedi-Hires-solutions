import type { Metadata } from "next";
import PartnerOnboardingForm from "@/components/partners/PartnerOnboardingForm";
import { requireAuth } from "@/lib/supabase/authz";
import { getMyPartnerAccount } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "List Your Vehicle",
  description: "Register your business and list a vehicle with Nedi Hires Solutions.",
  alternates: { canonical: "/partners/onboarding" },
};

// Listing a vehicle writes rows owned by the signed-in user, so a session is
// required — but not a partner role. Becoming a partner is what this page
// does, and the role is granted by the trigger on partners insert.
export default async function PartnerOnboardingPage() {
  const { userId } = await requireAuth("/partners/onboarding");

  // Someone returning to list a second vehicle skips the business step.
  const partner = await getMyPartnerAccount();

  return <PartnerOnboardingForm userId={userId} existingPartner={partner} />;
}
