import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { SITE_LAUNCHED } from "@/lib/features";

export default function robots(): MetadataRoute.Robots {
  // Before launch, search engines are asked to stay away entirely, so nothing
  // half-finished gets listed. See SITE_LAUNCHED in src/lib/features.ts.
  if (!SITE_LAUNCHED) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/booking", "/my-vehicles", "/api"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
