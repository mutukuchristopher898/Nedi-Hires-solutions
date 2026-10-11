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

// Enforced.
//
// This was report-only to begin with, to see what would break. The site
// loads nothing from third parties in the browser (no analytics, no embeds,
// no CDN scripts — checked), fonts are self-hosted by next/font, and the only
// outside connections are Supabase and the breached-password range check, so
// there was nothing left to learn from reporting.
//
// What enforcement buys even with 'unsafe-inline' still in script-src: no
// script, frame or plugin can load from any other site, injected markup
// cannot post a form or send data anywhere but here and Supabase, and the
// page cannot be framed for clickjacking. What it does not buy is protection
// from injected *inline* script; that needs a per-request nonce, which needs
// dynamic rendering on every page and gives up static prerendering of the
// marketing pages. A reasonable next step if that trade ever looks worth it.
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is what a nonce would replace. It is the reason this is
  // report-only rather than something to be proud of.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHost ? `https://${supabaseHost}` : ""}`.trim(),
  "font-src 'self' data:",
  // The selfie step draws the camera feed into a <video>; blob: covers a
  // captured frame being previewed.
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Nothing on the site embeds another site in a frame.
  "frame-src 'none'",
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
  // (The comment said two years before; the value was one. Now it matches.)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors above covers modern browsers; this covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The booking flow asks for a selfie, so camera stays available to this
  // origin. Nothing here needs a microphone, location or payment API.
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), " +
      "magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=(), interest-cohort=()",
  },
  // A page that opens ours in a popup gets no handle on it, and vice versa —
  // closes window.opener tricks and cross-window leaks in both directions.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Our pages and API responses may only be loaded by our own pages, so
  // another site cannot pull them in as a resource to probe.
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

// Pages that show one person's data: bookings, KYC details, admin screens.
// no-store keeps them out of shared caches and out of the browser's
// back/forward history on a shared computer — the internet-café case, which
// is a real one for a Nairobi customer base. Signing out on a shared machine
// should not leave someone's passport details one Back-button away.
const privateHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const PRIVATE_ROUTES = ["/account/:path*", "/admin/:path*", "/booking/:path*", "/my-vehicles/:path*", "/api/:path*", "/auth/:path*"];

const nextConfig: NextConfig = {
  // Stops advertising the framework in every response. Not a defence on its
  // own, just one less thing handed to an automated scanner.
  poweredByHeader: false,

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
    return [
      { source: "/:path*", headers: securityHeaders },
      ...PRIVATE_ROUTES.map((source) => ({ source, headers: privateHeaders })),
    ];
  },
};

export default nextConfig;
