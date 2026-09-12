import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every emailed auth link lands.
 *
 * @supabase/ssr's browser client uses the PKCE flow, so a password-recovery or
 * email-confirmation link arrives as `?code=...` and the code has to be
 * exchanged for a session on the server, where the cookie can be written.
 * There was no such route, which is why the site had no working password
 * reset — the email would have landed on a page that did nothing with it.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (!code) {
    return NextResponse.redirect(`${origin}/account/sign-in?error=link_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Recovery links are single-use and time-limited, so an expired or
    // already-used one is the ordinary case, not an exceptional one.
    return NextResponse.redirect(`${origin}/account/sign-in?error=link_expired`);
  }

  // Only relative paths, so a crafted ?next= cannot bounce someone off-site
  // with a freshly minted session.
  const destination = next.startsWith("/") ? next : "/account";
  return NextResponse.redirect(`${origin}${destination}`);
}
