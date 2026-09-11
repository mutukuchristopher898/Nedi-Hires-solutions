import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything that is either private, per-customer, or meaningless to a
      // crawler. /admin and /booking are already role- and session-protected;
      // this stops them being crawled and surfaced, it is not the access
      // control.
      disallow: ["/admin", "/account", "/booking", "/partners/dashboard", "/api"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
