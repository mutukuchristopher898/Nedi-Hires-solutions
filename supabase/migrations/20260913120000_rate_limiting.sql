-- Rate limiting, in the database.
--
-- Not in the application, because the writes worth limiting never reach it.
-- The contact form, quote requests and bookings all post straight to PostgREST
-- under RLS, so Next never sees them — middleware could rate limit our own
-- /api routes and page loads and would miss every one of these.
--
-- Login and sign-up are the same story for a different reason: they go from
-- the browser to Supabase Auth directly. Brute-force protection for those is
-- Supabase's own auth rate limiting, configured in the dashboard. Nothing in
-- this file or in our code can help with it.
--
-- The clearest hole this closes: "Anyone can submit a contact message" is
-- `to anon with check (true)`, so the contact form is an open firehose into a
-- table an admin has to read.

create table if not exists public.rate_limit_hits (
  bucket      text not null,
  identifier  text not null,
  hit_at      timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, identifier, hit_at desc);

alter table public.rate_limit_hits enable row level security;
-- Deliberately no policies: unreachable through PostgREST for every role, and
-- only touched from the security-definer function below. It records attempts
-- by anonymous submitters, so it should not be readable by them.

create or replace function public.enforce_rate_limit(
  p_bucket     text,
  p_identifier text,
  p_max        int,
  p_window     interval
)
returns void
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_count int;
begin
  -- Nothing to key on — an unauthenticated caller with no email, say. Better
  -- to allow than to reject everyone in that situation.
  if p_identifier is null or btrim(p_identifier) = '' then
    return;
  end if;

  -- Clear this key's expired attempts first. Index-supported and bounded, so
  -- a single caller cannot grow their own row set without limit.
  delete from public.rate_limit_hits
  where bucket = p_bucket
    and identifier = p_identifier
    and hit_at < now() - p_window;

  select count(*) into v_count
  from public.rate_limit_hits
  where bucket = p_bucket
    and identifier = p_identifier
    and hit_at > now() - p_window;

  if v_count >= p_max then
    -- 54000 is program_limit_exceeded. The app maps this to the "you're doing
    -- that too often" copy rather than showing a raw database error.
    raise exception 'Too many attempts. Please wait a little and try again.'
      using errcode = '54000', hint = 'rate_limited';
  end if;

  insert into public.rate_limit_hits (bucket, identifier) values (p_bucket, p_identifier);

  -- Occasional global sweep, so one-off identifiers do not accumulate for
  -- ever. Roughly one insert in a hundred pays for it, rather than every one.
  if random() < 0.01 then
    delete from public.rate_limit_hits where hit_at < now() - interval '2 days';
  end if;
end;
$fn$;

-- ─────────────────────────────────────────────────────────────
-- Contact form: the open one
-- ─────────────────────────────────────────────────────────────

create or replace function public.rate_limit_contact_message()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  -- Keyed on the email, lowercased, because an anonymous submitter has no
  -- account and Postgres cannot see their IP. Not perfect — someone can vary
  -- the address — but it stops the naive flood, and a varying address is at
  -- least visible as a pattern in the queue.
  perform public.enforce_rate_limit('contact_message', lower(btrim(new.email)), 3, interval '1 hour');
  return new;
end;
$fn$;

drop trigger if exists trg_rate_limit_contact_message on public.contact_messages;
create trigger trg_rate_limit_contact_message
  before insert on public.contact_messages
  for each row execute function public.rate_limit_contact_message();

-- ─────────────────────────────────────────────────────────────
-- Quote requests: signed in, so keyed on the account
-- ─────────────────────────────────────────────────────────────

create or replace function public.rate_limit_quote_request()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  perform public.enforce_rate_limit('quote_request', new.requester_profile_id::text, 5, interval '1 hour');
  return new;
end;
$fn$;

drop trigger if exists trg_rate_limit_quote_request on public.quote_requests;
create trigger trg_rate_limit_quote_request
  before insert on public.quote_requests
  for each row execute function public.rate_limit_quote_request();

-- ─────────────────────────────────────────────────────────────
-- Bookings: a cap on how fast one account can open them
--
-- Deliberately generous. The idempotency key already absorbs double-submits,
-- and the availability hold stops one person taking a vehicle twice, so this
-- is only here to stop an account opening bookings in bulk. A real customer
-- comparing two or three vehicles must not trip it.
-- ─────────────────────────────────────────────────────────────

create or replace function public.rate_limit_booking()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  perform public.enforce_rate_limit('booking', new.customer_id::text, 10, interval '1 hour');
  return new;
end;
$fn$;

drop trigger if exists trg_rate_limit_booking on public.bookings;
create trigger trg_rate_limit_booking
  before insert on public.bookings
  for each row execute function public.rate_limit_booking();
