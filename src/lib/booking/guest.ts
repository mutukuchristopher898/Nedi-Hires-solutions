// Guest booking ("book first, account after"), shared bits.
//
// A visitor with no account starts booking as a Supabase anonymous user: a
// real, signed-in session with no email, so every existing permission rule
// (their bookings, their uploads) applies unchanged. When they send the
// request they give an email; Supabase emails a confirmation link, and once
// clicked the same account becomes permanent and they create a password.
//
// If that email already has an account, the guest booking is moved into it
// after they sign in, using a one-time code kept only in this browser
// (supabase 8-guest-booking.sql: create_guest_claim / claim_guest_bookings).

export const GUEST_CLAIM_KEY = "nedi-guest-claim";
export const GUEST_EMAIL_KEY = "nedi-guest-email";

export function remember(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private browsing: the page still explains what to do */
  }
}

export function recall(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function forget(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to do */
  }
}

/** Where the confirmation and sign-in emails send people back to. */
export function authReturnUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** True for a guest (anonymous) session. */
export function isGuestUser(user: { is_anonymous?: boolean } | null | undefined): boolean {
  return Boolean(user?.is_anonymous);
}
