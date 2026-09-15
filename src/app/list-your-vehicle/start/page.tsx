import type { Metadata } from "next";
import PartnerOnboardingForm from "@/components/partners/PartnerOnboardingForm";
import { requireAuth } from "@/lib/supabase/authz";
import { getMyPartnerAccount, getOptions } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "List Your Vehicle",
  description: "Register your business and list a vehicle with Nedi Hires Solutions.",
  alternates: { canonical: "/list-your-vehicle/start" },
};

// Listing a vehicle writes rows owned by the signed-in user, so a session is
// required — but not a partner role. Becoming a partner is what this page
// does, and the role is granted by the trigger on partners insert.
export default async function OwnerOnboardingPage() {
  const { userId } = await requireAuth("/list-your-vehicle/start");

  // Someone returning to list a second vehicle skips the business step.
  const [operator, featureOptions, locationOptions] = await Promise.all([
    getMyPartnerAccount(),
    getOptions("vehicle_feature"),
    getOptions("pickup_location"),
  ]);

  return (
    <PartnerOnboardingForm
      userId={userId}
      existingPartner={operator}
      featureOptions={featureOptions}
      locationOptions={locationOptions}
    />
  );
}
