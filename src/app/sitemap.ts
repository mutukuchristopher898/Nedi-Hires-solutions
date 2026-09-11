import type { MetadataRoute } from "next";
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
  { path: "/search", changeFrequency: "daily", priority: 0.9 },
  { path: "/subscriptions", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
