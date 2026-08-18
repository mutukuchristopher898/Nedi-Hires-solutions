# Nedi Hires Solutions — Car Hire Platform

Next.js 16 frontend for Nedi Hires Solutions: search & booking flow, partner
onboarding/dashboard, admin approval queues, subscriptions, and customer
accounts.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend (Supabase)

The database schema lives in `supabase/migrations/`, and the client helpers
in `src/lib/supabase/`. To connect a real backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (Project Settings → API).
3. Push the schema: `npx supabase link --project-ref <your-project-ref>`
   then `npx supabase db push`.
4. (Optional) Seed local dev data: `npx supabase db reset` — requires Docker
   Desktop for the local Postgres instance.

The app currently reads from mock data in `src/lib/data.ts` rather than the
database; wiring pages to real Supabase queries is in progress.

## Tech

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- Supabase (Postgres, Auth, Storage) — client-side auth currently mocked via
  `src/lib/auth.tsx` pending real Supabase Auth wiring
