import type { NextConfig } from "next";

// Partner-uploaded vehicle photographs are served from the Supabase storage
// host, so next/image has to be told it may optimise them. Derived from the
// env var rather than hardcoding a project ref, so preview and production
// environments work without editing this file.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            // Only the public bucket path. Signed KYC URLs must never be
            // routed through the image optimiser.
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
