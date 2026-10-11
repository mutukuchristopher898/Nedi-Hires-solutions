import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Protections every state-changing /api route applies before doing any work.
// Each one is small; together they are the difference between "the route is
// correct when called properly" and "the route is safe when called by anyone".

/**
 * Cross-site request forgery guard.
 *
 * The Supabase session cookie is SameSite=Lax, which already stops a foreign
 * page POSTing with it in every current browser. This is the second layer, so
 * a cookie-setting change, an older browser, or a sibling subdomain added
 * later does not quietly reopen it: a state-changing request must come from a
 * page on this site.
 *
 * Sec-Fetch-Site is set by the browser and cannot be forged by page script.
 * Origin is the fallback for clients that do not send it. A request with
 * neither is not from a browser page (curl, a server), which CSRF is not about,
 * and those still have to carry a valid session to get anywhere.
 */
export function rejectCrossSite(request: Request): NextResponse | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!host || originHost !== host) {
      return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
    }
  }

  return null;
}

/**
 * request.json() throws on a malformed body, which surfaced as an unhandled
 * 500 with a stack trace in the logs. This turns it into an ordinary 400, and
 * insists on a JSON object so destructuring a number or an array cannot
 * produce surprising undefineds further down.
 */
export async function readJsonObject(
  request: Request,
): Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  // JSON bodies on these routes are a few kilobytes at most. Anything larger
  // is either a mistake or an attempt to make the function buffer it.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 64 * 1024) {
    return { error: NextResponse.json({ error: "Request too large." }, { status: 413 }) };
  }

  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: NextResponse.json({ error: "Malformed request." }, { status: 400 }) };
    }
    return { body: parsed as Record<string, unknown> };
  } catch {
    return { error: NextResponse.json({ error: "Malformed request." }, { status: 400 }) };
  }
}

/**
 * Buckets for per-account limits on the /api routes. The limits themselves
 * live in the database (check_api_rate_limit, migration 20261011090000), so a
 * caller cannot choose a generous one — this list only names which to apply.
 *
 * Kept in the database rather than in memory because Vercel runs many
 * short-lived instances; a counter in one of them is invisible to the others.
 */
export type ApiRateBucket =
  | "kyc_upload"
  | "vehicle_photo_upload"
  | "vehicle_document_upload"
  | "identity_verification"
  | "applicant_submit"
  | "admin_export"
  | "admin_erase";

export async function enforceApiRateLimit(
  supabase: SupabaseClient,
  bucket: ApiRateBucket,
): Promise<NextResponse | null> {
  const { error } = await supabase.rpc("check_api_rate_limit", { p_bucket: bucket });

  if (!error) return null;

  // 54000 is the code enforce_rate_limit raises with.
  if (error.code === "54000") {
    return NextResponse.json(
      { error: "You're doing that too often. Please wait a little and try again." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  // Failing closed: if the limiter is unavailable, the expensive work behind
  // it (image processing, paid identity checks) does not run unmetered.
  return NextResponse.json(
    { error: "Something went wrong. Please try again in a moment." },
    { status: 503 },
  );
}

// ── Uploads ─────────────────────────────────────────────────

/**
 * The largest image, in pixels, sharp will decode. A 10MB PNG can declare
 * itself 60,000 × 60,000 and expand to gigabytes in memory — a
 * "decompression bomb" that takes the function down. 50 megapixels is well
 * above any phone camera and far below that.
 */
export const MAX_INPUT_PIXELS = 50_000_000;

/**
 * PDFs cannot be re-encoded, so they are stored as uploaded. An identity
 * document scan or an insurance certificate has no reason to run code, open
 * another program or smuggle in an attached file, so a PDF declaring any of
 * those is refused.
 *
 * Best effort, and said so: these markers can be hidden inside compressed
 * object streams, so this catches the ordinary malicious PDF rather than
 * guaranteeing every one. The other layers still stand — private bucket,
 * short-lived signed URLs, served from Supabase's origin and never rendered
 * inside ours.
 */
const PDF_ACTIVE_CONTENT = /\/(JavaScript|JS|Launch|EmbeddedFiles?|RichMedia|SubmitForm|ImportData)\b/;

export function pdfHasActiveContent(bytes: Buffer): boolean {
  return PDF_ACTIVE_CONTENT.test(bytes.toString("latin1"));
}
