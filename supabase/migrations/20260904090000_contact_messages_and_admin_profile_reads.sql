-- ═══════════════════════════════════════════════════════════════════════════
-- Contact enquiries, and letting admins read customer names
-- (audit findings F09, F10, F24)
--
-- F09: the contact form validated its input and then called setSent(true) and
-- stopped -- no write, no email, nothing. Every enquiry was discarded while
-- the customer was told "Message Sent". There is no mail provider in this
-- project, so enquiries land in a table with an admin queue, exactly like
-- quote_requests already does.
--
-- F24 is a prerequisite for F10: the admin override policies added in
-- 20260818120000 cover partners, vehicles, bookings and identity_documents
-- but never profiles, so an admin joining to a customer's name got NULL back.
-- Wiring the document queue to real data needs that join to work.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. Contact enquiries
-- ─────────────────────────────────────────────────────────────
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 2 and 120),
  email      text not null check (char_length(trim(email)) between 3 and 254),
  phone      text check (phone is null or char_length(trim(phone)) <= 40),
  message    text not null check (char_length(trim(message)) between 10 and 4000),
  status     text not null default 'new' check (status in ('new', 'read', 'replied')),
  -- Set when a signed-in customer submits, so their enquiry can be tied back
  -- to their account. Null for anonymous visitors, which is the common case.
  sender_profile_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on contact_messages (status, created_at desc);

alter table contact_messages enable row level security;

-- The contact form is public -- an anonymous visitor is the normal sender --
-- so insert is deliberately open to anon. The length CHECKs above are the
-- only guard against oversized payloads. Note this is spammable by design,
-- as any public contact form is; if that becomes a problem the answer is a
-- rate limit or captcha at the edge, not an RLS change.
create policy "Anyone can submit a contact message" on contact_messages
  for insert to anon, authenticated with check (true);

create policy "Admins can read contact messages" on contact_messages
  for select using (is_admin());

create policy "Admins can update contact messages" on contact_messages
  for update using (is_admin());


-- ─────────────────────────────────────────────────────────────
-- 2. Let admins read customer profiles  (F24)
-- ─────────────────────────────────────────────────────────────
-- Without this, the identity-document queue can list a document but not say
-- whose it is. profiles was the one table the original admin-override block
-- missed.
create policy "Admins can view all profiles" on profiles
  for select using (is_admin());
