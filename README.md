# Nedi Hires Solutions — Car Hire Platform

Next.js 16 site for Nedi Hires Solutions (Nairobi, Kenya): vehicle search &
booking with a real KYC/verification pipeline, customer accounts, segmented
subscriptions, a loyalty program, and partner/admin tooling — backed by a
real Supabase database with Row Level Security throughout.

**Live:** https://nedi-hires-solutions.vercel.app

**New to this project? Start with [`ONBOARDING.md`](./ONBOARDING.md)** — it
covers the tech stack, folder structure, full database schema, how the
booking flow works end-to-end, what's still mock vs. real, and known
security notes.

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in real values — see ONBOARDING.md §3
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Schema lives in `supabase/migrations/` (run in filename order via the
Supabase SQL Editor — see `ONBOARDING.md` §5 for the full list and what
each one does). `supabase/seed.sql` is local-dev-only reference data.

## Tech

- Next.js 16 (App Router, Turbopack) — see `AGENTS.md` for breaking changes
  vs. older Next.js before writing any code here
- Tailwind CSS v4
- Supabase (Postgres + RLS, Auth, Storage)
- Smile Identity (KYC/selfie verification — integration built, real
  credentials not yet configured)
- Deployed on Vercel, auto-deploys on push to `main`
