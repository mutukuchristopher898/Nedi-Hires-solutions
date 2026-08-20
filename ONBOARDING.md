# Nedi Hires Solutions — Onboarding Guide

This is a real car-hire, tours & travel business based in Nairobi, Kenya. This document explains the whole system — code, database, and deployment — well enough for someone who has never seen the project to get productive.

---

## 1. What this is

A Next.js website for **Nedi Hires Solutions**: customers browse and book vehicles, subscribe to mobility plans, partners list vehicles and request custom quotes, and admins review everything. Real user accounts, a real Postgres database, and a real KYC/verification pipeline are all live — this is not a static mockup.

**Live site:** https://nedi-hires-solutions.vercel.app
**Code:** https://github.com/mutukuchristopher898/Nedi-Hires-solutions
**Database/Auth/Storage:** Supabase project `uapcpmlfkquzwjyfzqph`
**Hosting:** Vercel, auto-deploys on every push to `main`

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) — **note:** this version has real breaking changes vs. older Next.js (e.g. `middleware.ts` is now `proxy.ts`, `params`/`searchParams` are Promises). See `AGENTS.md` before writing Next.js code. |
| Styling | Tailwind CSS v4 |
| Database / Auth / Storage | Supabase (Postgres + Row Level Security, Supabase Auth, Supabase Storage) |
| Identity verification | Smile Identity (Kenya/East Africa KYC provider) — integration built, but **not yet configured** with real credentials (see §8) |
| Hosting | Vercel, connected directly to the GitHub repo |

No other backend exists — every database write goes through Supabase directly from the browser (governed by Row Level Security) or through one of the two API routes under `src/app/api/` (the only place a secret key is ever used).

---

## 3. Getting set up locally

```bash
git clone https://github.com/mutukuchristopher898/Nedi-Hires-solutions.git
cd Nedi-Hires-solutions
npm install
cp .env.local.example .env.local   # then fill in real values, see below
npm run dev
```

Open http://localhost:3000.

### Environment variables (`.env.local`)

| Variable | Where to get it | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page | Yes |
| `SMILE_IDENTITY_PARTNER_ID` | Smile Identity portal, after signing up | No — verification just stays "pending" (manual review) without it |
| `SMILE_IDENTITY_API_KEY` | Same | No |

These same variables (with real values) are already set in **Vercel → Project Settings → Environment Variables** for the live site. `.env.local` is gitignored — it has never been and should never be committed.

### Useful commands

```bash
npm run dev      # local dev server (Turbopack)
npm run build    # production build — run this + npm run lint before considering any change done
npm run lint     # ESLint
```

---

## 4. Where things live

```
src/
  app/                    Next.js routes (App Router — each page.tsx is a route)
    account/              sign-up, sign-in, and the customer dashboard (bookings/documents/loyalty/profile tabs)
    admin/                admin console — layout.tsx gates the whole section to role='admin'
      quotes/             REAL, Supabase-backed — partner quote requests
      approvals/          still MOCK data — not wired to Supabase yet (known gap, see §9)
      documents/          still MOCK data — same gap
    api/                  the only two server-side routes in the app (see §7)
    booking/[id]/         the 7-step reservation wizard for one vehicle
    partners/             partner marketing page, onboarding (mock, see §9), dashboard (mock), quote request (real)
    search/, vehicles/[id]/, page.tsx (home)   public browsing — reads from src/lib/data.ts
    subscriptions/        segmented subscription plans (real Supabase data)
  components/
    booking/              the 7 step components + the orchestrator (BookingWizard.tsx)
    admin/, subscriptions/   small feature-specific pieces
    (top-level files)     shared UI: Header, Footer, VehicleCard, DemoTag, etc.
  lib/
    data.ts               mock display data: the 245-vehicle illustrative fleet, testimonials, services copy
    vehicleCatalog.ts      the underlying ~245-model Kenya vehicle reference (make/model/year/cc/colours) — see §6
    types.ts               all shared TypeScript types
    auth.tsx               React context wrapping real Supabase Auth (NOT mocked — this used to be, early on, but isn't anymore)
    eligibility.ts         self-drive age/license-experience rules, mirrored by a DB trigger
    smileIdentity.ts        server-only Smile Identity API wrapper
    supabase/
      client.ts            browser Supabase client
      server.ts             server-component Supabase client (reads cookies)
      authz.ts              requireAuth() / requireRole() route guards
      queries.ts            typed read queries (subscriptions, quotes, vehicle-slug lookup)
      storage.ts            KYC file upload helper
supabase/
  migrations/              every schema change, in order — see §5
  seed.sql                  local-dev-only seed data (never run against production; production got the same data via hand-pasted migration SQL)
scripts/
  generate-demo-fleet.ts    regenerates the demo fleet from vehicleCatalog.ts (rerun after editing pricing/rules)
  splice-fleet.mjs           splices the generator's output into src/lib/data.ts
```

---

## 5. The database, from scratch

If the Supabase project ever needs to be rebuilt, run every file in `supabase/migrations/` **in filename order** (they're timestamp-prefixed) via the Supabase SQL Editor. Each one was written and run exactly that way — there is no CLI-linked migration history to rely on.

| Migration | What it adds |
|---|---|
| `20260818120000_init_schema.sql` | Core schema: `profiles`, `partners`, `vehicles`, `bookings`, `identity_documents`, `subscription_plans`, `subscriptions`, `is_admin()`, RLS on everything |
| `20260819120000_demo_fleet_and_slugs.sql` | Adds `slug`/`partner_name`/`is_demo` to `vehicles`; backs the original 14-vehicle illustrative fleet with real rows |
| `20260820120000_trip_details_kyc_and_agreement.sql` | Trip details columns on `bookings`; new `booking_applicants` table; rental agreement sign-off fields |
| `20260821090000_applicant_name_and_optional_dob.sql` | Adds applicant `full_name`; makes `date_of_birth` optional (chauffeur bookings don't need it) |
| `20260822090000_verification_pipeline.sql` | `verification_status`/`verification_notes` on `booking_applicants`; guarantor-can't-be-self constraint; `find_duplicate_id_number()`; adds `'Selfie Verification'` doc type |
| `20260823090000_subscription_audiences_and_pricing.sql` | `audience`/`quarterly_price`/`annual_price`/`vehicle_count_max` on `subscription_plans`; adds the diaspora/corporate/partner plans |
| `20260823091000_quote_requests_and_loyalty.sql` | `quote_requests` table; `loyalty_accounts` + `loyalty_transactions` + the points-award trigger |
| `20260823093000_fix_profile_role_escalation.sql` | **Security fix** — see §10 |
| `20260824090000_expand_demo_fleet_catalog.sql` | Adds the remaining ~245 illustrative demo vehicles as real rows |

`supabase/seed.sql` additionally seeds the 3 real subscription plans and the 2 real starting Toyota Fielders — this is what production actually has as its **real, non-demo** inventory, distinct from the illustrative catalog.

### The tables, in plain English

- **`profiles`** — one row per signed-up user (auto-created on sign-up). `role` is `customer` / `partner` / `admin`. Only an admin can change a `role` (enforced by a DB trigger, not just app logic).
- **`vehicles`** — every vehicle shown or bookable. `is_demo = true` marks illustrative fleet rows; `is_demo = false` is the real 2-Fielder starting fleet.
- **`bookings`** — one row per reservation, walking through `deposit_pending → verification_pending → settlement_pending → confirmed` (or `cancelled`).
- **`booking_applicants`** — the KYC data for a booking: ID/passport details, guarantor, driver eligibility fields, agreement sign-off, and `verification_status` (`pending` / `verified` / `needs_review` / `failed`).
- **`identity_documents`** — one row per uploaded file (ID scan, license scan, passport photo, selfie), stored in the private `kyc-documents` Storage bucket.
- **`subscription_plans`** / **`subscriptions`** — plans segmented by `audience` (individual/diaspora/corporate/partner) and billing cycle; a subscription links a customer to a plan.
- **`partners`** — a partner's business record, linked to their `profiles` row.
- **`quote_requests`** — custom pricing requests from partners with larger fleets, reviewed by admins at `/admin/quotes`.
- **`loyalty_accounts`** / **`loyalty_transactions`** — points balance + Bronze/Silver/Gold tier, awarded automatically by a trigger when a booking is confirmed (never by the app directly).

---

## 6. The illustrative demo fleet — what's real, what isn't

Real inventory today: **2 Toyota Fielders** (`is_demo = false` in `vehicles`). Everything else — 245 vehicles across every major brand sold in Kenya — is **illustrative demo data**, clearly labeled with an amber "Illustrative Demo" / "Illustrative Fleet Catalog" tag anywhere it's shown on the site. This was a deliberate choice by the business owner: keep a rich, realistic-looking catalog for the product to feel complete, rather than shrinking everything to match the current tiny real fleet.

The demo fleet's specs (price, cc, colours, capacity) are **derived, not hand-verified factory data** — see the big comment at the top of `src/lib/vehicleCatalog.ts`. To adjust pricing or rules across the whole demo fleet: edit the derivation logic in `scripts/generate-demo-fleet.ts`, run `npx tsx scripts/generate-demo-fleet.ts` (installs `tsx` temporarily if needed), then `node scripts/splice-fleet.mjs` to regenerate `src/lib/data.ts`, and re-run the equivalent SQL against Supabase (the script also writes a fresh `scripts/output/demo-fleet.sql`).

Several other numbers are placeholders pending the owner's real figures — all clearly commented where they live:
- Diaspora/Corporate/Partner subscription pricing, and the "10x monthly" annual-plan discount (`subscription_plans` table)
- Loyalty point-earn rate (1 point per KES 100) and tier thresholds (Bronze/Silver/Gold at 0/1500/5000 lifetime points) — in the `award_loyalty_points_on_confirm()` function

---

## 7. How the reservation flow actually works

`/booking/[id]` runs a 7-step wizard (`src/components/booking/BookingWizard.tsx` orchestrates; each step is its own file in the same folder):

1. **Trip Details** — pickup date/point, destination (Kenya-only dropdown), purpose, days, self-drive vs. chauffeur. Self-drive collects DOB + license issue date; **this is where the `bookings` row gets created.**
2. **Applicant & Guarantor** — ID/passport + driving license (self-drive only) + passport photo uploads, guarantor details. A guarantor can't be the same person as the applicant (enforced client-side *and* by a DB constraint). On submit, this calls `/api/verify-document`, which talks to Smile Identity (or fails soft to "pending" if unconfigured).
3. **Selfie Verification** — a **live camera capture** (not a file upload) — calls `/api/verify-selfie` to match it against the ID photo.
4. **Rental Agreement** — checkbox + typed signature (explicitly marked as a draft pending real legal review, like `/terms`).
5. **Deposit**, 6. **Verification** (admin review, currently simulated with a manual "approve" button), 7. **Settlement** → **Confirmed**.

Self-drive eligibility (27+ years old, 3+ years licensed) is enforced twice: once in the browser for instant feedback, and once by a Postgres trigger (`check_driver_eligibility()`) so it can't be bypassed with a raw API call. The customer only ever sees a generic error if they don't qualify — the exact threshold isn't shown to them on purpose.

---

## 8. What's NOT done yet (don't be surprised)

- **No real payment processing anywhere.** "Pay Deposit," "Complete Payment," and subscription "Choose Plan" buttons write database rows but never move real money. Likely next step: M-Pesa (Daraja API) integration.
- **Smile Identity isn't configured with real credentials.** The whole verification pipeline works and fails soft to "pending" — sign up at Smile Identity and add the two env vars (§3) to turn on real automated checks.
- **`admin/approvals` and `admin/documents` are still mock data**, not wired to Supabase. `admin/quotes` is the one real, working admin page.
- **`partners/onboarding` and `partners/dashboard` are still mock** — the vehicle-listing form has a real make/model picklist (from `vehicleCatalog.ts`) but the actual submission doesn't write to Supabase yet.
- **Loyalty points can be earned but not spent** — no redemption-at-checkout flow exists yet.
- **Partner custom quotes are manual** — `quote_requests` captures the lead for an admin to follow up with, there's no automated pricing engine.

---

## 9. Security notes worth knowing

- The Supabase **`service_role` key has never been used anywhere** in this project — not in the app, not by whoever built it, ever pasted into chat. Every privileged check (admin overrides, duplicate-ID lookups) uses narrow `security definer` Postgres functions instead, which is the least-privilege way to do it.
- **A real privilege-escalation bug was found and fixed** (`20260823093000_fix_profile_role_escalation.sql`): the `profiles` "owner can edit their own row" policy didn't originally restrict *which* columns could change, so any signed-up customer could `PATCH` their own `role` to `admin` and pass every admin-only page guard. A trigger now blocks any role change that isn't performed by an existing admin. Verified closed with a real exploit attempt against the live database.
- To make your own account an admin: sign up normally on the live site, then in the Supabase SQL Editor run:
  ```sql
  update profiles set role = 'admin'
  where id = (select id from auth.users where email = 'your-email@example.com');
  ```

---

## 10. If you get stuck

- Read `AGENTS.md` at the repo root before writing any Next.js code — this version has real breaking changes from what most training data assumes.
- Every non-trivial change in this project's history was verified end-to-end (via a temporary Playwright script, removed afterward) against either localhost or the live production URL before being called done — that's the bar to match.
- The Supabase dashboard SQL Editor is where every migration in `supabase/migrations/` was actually run — there's no working `supabase db push` workflow set up for this project; don't assume the CLI link is configured.
