import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SITE_LAUNCHED } from "@/lib/features";

// Pages that stay reachable before launch: the coming-soon page itself, the
// staff sign-in and password reset flow, the auth callback, and the API and
// admin routes (which do their own permission checks). Customer sign-up is
// deliberately not on the list.
const PREVIEW_COOKIE = "nedi_preview";

const PRELAUNCH_OPEN = [
  /^\/coming-soon$/,
  /^\/account\/(sign-in|forgot-password|reset-password|welcome|claim)$/,
  /^\/auth\//,
  /^\/api\//,
  /^\/admin(\/|$)/,
  /^\/robots\.txt$/,
  /^\/\.well-known\//,
  /^\/(opengraph|twitter)-image/,
];

// Refreshes the Supabase auth session cookie on every request.
// Named `proxy` per Next.js 16 (renamed from `middleware`).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();

  if (!SITE_LAUNCHED) {
    // Nothing is listed by search engines before launch, whoever is looking.
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    const path = request.nextUrl.pathname;

    // Private preview: opening any page with ?preview=<PREVIEW_CODE> lets
    // that one browser see the real site for 30 days, exactly as a customer
    // will after launch (guest booking included). The code lives only in
    // Vercel's environment variables, never in the code, so it stays secret
    // even though the code is public. ?preview=off ends it. With no
    // PREVIEW_CODE set (or one under 16 characters) there is no preview.
    const previewCode = process.env.PREVIEW_CODE ?? "";
    if (previewCode.length >= 16) {
      const asked = request.nextUrl.searchParams.get("preview");
      if (asked === previewCode || asked === "off") {
        const clean = request.nextUrl.clone();
        clean.searchParams.delete("preview");
        const redirect = NextResponse.redirect(clean);
        response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
        if (asked === "off") redirect.cookies.delete(PREVIEW_COOKIE);
        else
          redirect.cookies.set(PREVIEW_COOKIE, previewCode, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        return redirect;
      }
      if (request.cookies.get(PREVIEW_COOKIE)?.value === previewCode) {
        return response;
      }
    }

    if (!PRELAUNCH_OPEN.some((rule) => rule.test(path))) {
      // Admin and staff see the real site, to prepare it. Everyone else sees
      // the coming-soon page, at whatever address they typed.
      let isStaff = false;
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        isStaff = profile?.role === "admin" || profile?.role === "staff";
      }
      if (!isStaff) {
        const rewrite = NextResponse.rewrite(new URL("/coming-soon", request.url));
        response.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
        rewrite.headers.set("X-Robots-Tag", "noindex, nofollow");
        rewrite.headers.set("Cache-Control", "private, no-store");
        return rewrite;
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
