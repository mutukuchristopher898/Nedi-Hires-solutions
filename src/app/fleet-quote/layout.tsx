import { requireAuth } from "@/lib/supabase/authz";

export default async function OwnerQuoteLayout({ children }: { children: React.ReactNode }) {
  await requireAuth("/fleet-quote");
  return children;
}
