// Where to send someone after sign-in, sign-up or an emailed auth link.
//
// The destination arrives in ?next=, which anyone can put in a link. Without a
// check, https://site/account/sign-in?next=https://evil.example signs a real
// customer in and then hands them to a look-alike page that asks for their
// password "again" — the classic post-login phishing bounce.
//
// startsWith("/") is not enough on its own: "//evil.example" and
// "/\evil.example" both start with a slash, and browsers treat both as a
// protocol-relative URL to another host. So the value is resolved against a
// fixed dummy origin and only accepted if it stays on that origin.

const FALLBACK = "/account";
const PROBE_ORIGIN = "https://same-origin.invalid";

export function safeRedirectPath(next: string | null | undefined, fallback: string = FALLBACK): string {
  if (!next || typeof next !== "string") return fallback;

  // Control characters and backslashes have no business in one of our paths,
  // and are how parser-differential tricks get started.
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;

  try {
    const url = new URL(next, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
