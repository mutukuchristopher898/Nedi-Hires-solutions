import { requireAuth } from "@/lib/supabase/authz";

export default async function PartnerQuoteLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/partners/quote");
  return children;
}
