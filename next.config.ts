import type { NextConfig } from "next";

// Partner-uploaded vehicle photographs are served from the Supabase storage
// host, so next/image has to be told it may optimise them. Derived from the
// env var rather than hardcoding a project ref, so preview and production
// environments work without editing this file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

// Supabase is reached over both https (REST, storage, auth) and wss (realtime).
const supabaseOrigins = supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : "";

const isDev = process.env.NODE_ENV === "development";

// Reported, not enforced, on purpose.
//
// A strict script-src needs a per-request nonce, which needs dynamic
// rendering on every page — that would give up the static prerendering the
// marketing pages currently get. And Next's hydration bootstrap plus
// Tailwind's injected styles both need allowing before anything can be
// tightened. Report-only shows what would break, in the browser console,
// without breaking it. Promote to Content-Security-Policy once the reports
// are clean.
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is what a nonce would replace. It is the reason this is
  // report-only rather than something to be proud of.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHost ? `https://${supabaseHost}` : ""}`.trim(),
  "font-src 'self' data:",
  // api.pwnedpasswords.com is the breached-password check. It only ever
  // receives a 5-character hash prefix, never a password.
  `connect-src 'self' https://api.pwnedpasswords.com ${supabaseOrigins}`.trim(),
  // No plugins, no framing, and forms may only post back to us.
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Two years, and Vercel serves https only. Worth knowing before a custom
  // domain is added: includeSubDomains commits every subdomain to https too.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors above covers modern browsers; this covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The booking flow asks for a selfie, so camera stays available to this
  // origin. Nothing here needs a microphone, location or payment API.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

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

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
