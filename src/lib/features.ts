// Feature switches. Change a value here, commit, and the site follows.

/**
 * Selfie verification step in the booking flow.
 *
 * Switched OFF for now (owner's decision, October 2026); it will come back.
 * While off:
 *   - the "Selfie Verification" step is removed from the booking wizard, so
 *     customers go straight from Applicant & Guarantor to Rental Agreement;
 *   - anyone who lands on the old selfie page (a bookmark, or a booking that
 *     was in progress) is sent on to the agreement;
 *   - /api/verify-selfie and selfie uploads to /api/kyc-document are refused,
 *     so a feature nobody can see is not an endpoint anyone can call.
 *
 * Document verification (ID, licence, passport photo) is unaffected.
 *
 * To turn it back on: change false to true. All the selfie code is still in
 * place: src/app/booking/[id]/selfie, SelfieCaptureStep, /api/verify-selfie.
 */
export const SELFIE_VERIFICATION_ENABLED = false;

/**
 * Whether the site is open to the public.
 *
 * false = pre-launch: visitors see the "Coming soon" page (with contact
 * details), search engines are asked not to list anything, and new customer
 * sign-ups are paused. Admin and staff accounts can still sign in and use the
 * whole site, to prepare the fleet and test bookings.
 *
 * Launch day: change false to true, commit, and the full site opens.
 */
export const SITE_LAUNCHED = false;

/**
 * Mobility subscriptions (monthly plans). A work in progress: while false,
 * the page sends visitors to /services, and it is left out of the top bar,
 * the footer and the sitemap. Change to true when it is ready, and add the
 * links back (Header.tsx, Footer.tsx, sitemap.ts).
 */
export const SUBSCRIPTIONS_ENABLED = false;
