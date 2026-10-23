import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/lib/site";

// Public, indexable pages only. Everything behind sign-in — /account, /booking,
// /admin, the partner dashboard — is excluded here and disallowed in robots.ts.
//
// Vehicle detail pages are deliberately left out. The fleet is still the
// illustrative catalogue rather than confirmed inventory, and listing a few
// hundred of those would have search engines indexing vehicles that may not
// exist. Add them here once the fleet is real.
const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/fleet", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/list-your-vehicle", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

// Rebuilt at most once an hour, so new vehicles appear without a redeploy.
export const revalidate = 3600;

/**
 * Every vehicle customers can see gets its own sitemap entry: people search
 * for specific cars ("Prado hire Nairobi"), and each vehicle page is the
 * best answer to that. Uses the public key and the same visibility rule as
 * the fleet page, so only approved, visible vehicles are listed. If the
 * database cannot be reached, the fixed pages are still returned.
 */
async function vehicleEntries(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("vehicles")
      .select("slug, created_at")
      .eq("approval_status", "approved")
      .is("hidden_at", null)
      .is("archived_at", null)
      .limit(1000);
    if (error || !data) return [];
    return (data as { slug: string | null; created_at: string }[])
      .filter((v) => v.slug)
      .map((v) => ({
        url: `${site.url}/vehicles/${v.slug}`,
        lastModified: new Date(v.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const fixed = ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
  return [...fixed, ...(await vehicleEntries())];
}
