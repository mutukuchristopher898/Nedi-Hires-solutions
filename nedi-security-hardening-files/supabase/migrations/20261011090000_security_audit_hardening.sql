-- Security audit hardening (October 2026)
--
-- Run in the Supabase SQL Editor after every earlier migration, like the rest.
-- Safe to re-run: every statement is create-or-replace, drop-if-exists, or
-- guarded.
--
-- What this closes, in order:
--   1. enforce_rate_limit() was callable by anyone, signed in or not.
--   2. Per-account limits for the Next.js /api routes.
--   3. The two ID-number lookups were an oracle for any signed-up user.
--   4. Helper functions executable by anonymous visitors for no reason.
--   5. A booking whose identity check FAILED could still be confirmed.
--   6. Free-text columns customers and partners write had no length cap.
--
-- PREREQUISITE: the verification_writer key from 20260903120000 must be set,
-- and VERIFICATION_WRITER_SECRET must hold the same value in Vercel. After
-- this migration the applicant step depends on it too, not only the
-- verification routes.


-- ─────────────────────────────────────────────────────────────
-- 1. enforce_rate_limit: no longer callable from outside
-- ─────────────────────────────────────────────────────────────
-- It is security definer and was granted to PUBLIC by default, so anyone could
-- POST to /rest/v1/rpc/enforce_rate_limit with any bucket and identifier. Two
-- abuses:
--   * Lock a real customer out: call it repeatedly with bucket 'booking' and
--     their account id, and their next booking is refused as "too many
--     attempts". Same for a known email and the contact form.
--   * Fill rate_limit_hits with junk rows as fast as requests can be sent.
--
-- The triggers that legitimately call it run as the inserting user, so they
-- become security definer here, which lets them keep calling it after the
-- grant is gone. A trigger function cannot itself be called through the API.

alter function public.rate_limit_contact_message() security definer;
alter function public.rate_limit_quote_request()   security definer;
alter function public.rate_limit_booking()         security definer;

revoke all on function public.enforce_rate_limit(text, text, int, interval) from public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 2. Per-account limits for the /api routes
-- ─────────────────────────────────────────────────────────────
-- The caller names a bucket; the limit and the identifier are decided here.
-- The identifier is always the caller's own account, so the worst anyone can
-- do by calling this directly is use up their own allowance.

create or replace function public.check_api_rate_limit(p_bucket text)
returns void
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_uid    uuid := auth.uid();
  v_max    int;
  v_window interval;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  -- Sized so a real person never meets them. A booking uploads four files and
  -- runs two identity checks; a partner listing a vehicle uploads a few
  -- photos and three or four documents.
  case p_bucket
    when 'kyc_upload'              then v_max := 40; v_window := interval '1 hour';
    when 'vehicle_photo_upload'    then v_max := 80; v_window := interval '1 hour';
    when 'vehicle_document_upload' then v_max := 40; v_window := interval '1 hour';
    when 'identity_verification'   then v_max := 15; v_window := interval '1 hour';
    when 'applicant_submit'        then v_max := 20; v_window := interval '1 hour';
    when 'admin_export'            then v_max := 60; v_window := interval '1 hour';
    when 'admin_erase'             then v_max := 10; v_window := interval '1 day';
    else
      raise exception 'Unknown rate limit bucket %', p_bucket;
  end case;

  perform public.enforce_rate_limit('api:' || p_bucket, v_uid::text, v_max, v_window);
end;
$fn$;

revoke all on function public.check_api_rate_limit(text) from public, anon;
grant execute on function public.check_api_rate_limit(text) to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 3. ID-number lookups: server only
-- ─────────────────────────────────────────────────────────────
-- Both were security definer and granted to every signed-in account, and
-- sign-up is open. So anyone could create an account and ask:
--   * find_duplicate_id_number('<a national ID number>', <any uuid>)
--       → is this person a customer of ours?
--   * find_overlapping_active_booking('<ID>', '1900-01-01', '2100-01-01', <uuid>)
--       → their booking reference, and by narrowing the dates, exactly when
--         they will be renting a car. That is stalking-grade information.
-- The submit-applicant route also echoed that booking reference back in its
-- error message to whoever submitted the ID number.
--
-- Now both require the same server-only secret as apply_verification_result,
-- and the overlap check only returns a reference for the caller's own booking.

create or replace function public.has_app_capability(p_name text, p_secret text)
returns boolean
language sql
security definer set search_path = public
stable
as $fn$
  select coalesce(
    (select secret_sha256 = encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex')
       from app_capability_keys
      where name = p_name),
    false
  );
$fn$;

-- Internal only. Callable from the functions below (which run as the owner),
-- never through the API.
revoke all on function public.has_app_capability(text, text) from public, anon, authenticated;

drop function if exists public.find_duplicate_id_number(text, uuid);

create or replace function public.find_duplicate_id_number(
  p_id_number           text,
  p_exclude_customer_id uuid,
  p_writer_secret       text
)
returns boolean
language plpgsql
security definer set search_path = public
stable
as $fn$
begin
  if not public.has_app_capability('verification_writer', p_writer_secret) then
    raise exception 'Not authorised to look up identity numbers';
  end if;

  return exists (
    select 1 from booking_applicants
     where id_number_normalized = upper(regexp_replace(p_id_number, '[\s\-./]', '', 'g'))
       and customer_id <> p_exclude_customer_id
  );
end;
$fn$;

revoke all on function public.find_duplicate_id_number(text, uuid, text) from public, anon;
grant execute on function public.find_duplicate_id_number(text, uuid, text) to authenticated;

drop function if exists public.find_overlapping_active_booking(text, date, date, uuid);

create or replace function public.find_overlapping_active_booking(
  p_id_number_normalized text,
  p_start                date,
  p_end                  date,
  p_exclude_booking_id   uuid,
  p_writer_secret        text
)
returns table (booking_id uuid, booking_ref text)
language plpgsql
security definer set search_path = public
stable
as $fn$
begin
  if not public.has_app_capability('verification_writer', p_writer_secret) then
    raise exception 'Not authorised to look up identity numbers';
  end if;

  -- The clash is still detected across accounts (one person, two accounts,
  -- same dates is exactly what this exists to catch), but the identifying
  -- details only come back when the clashing booking is the caller's own.
  return query
    select case when b.customer_id = auth.uid() then b.id end,
           case when b.customer_id = auth.uid() then b.booking_ref end
      from bookings b
      join booking_applicants a on a.booking_id = b.id
     where a.id_number_normalized = p_id_number_normalized
       and b.id <> p_exclude_booking_id
       and b.status in ('deposit_pending', 'verification_pending', 'settlement_pending', 'confirmed')
       and b.start_date <= p_end
       and b.end_date >= p_start
     limit 1;
end;
$fn$;

revoke all on function public.find_overlapping_active_booking(text, date, date, uuid, text) from public, anon;
grant execute on function public.find_overlapping_active_booking(text, date, date, uuid, text) to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 4. Helpers anonymous visitors had no reason to call
-- ─────────────────────────────────────────────────────────────
-- Both security definer, both executable by PUBLIC by default. Nothing an
-- anonymous visitor does creates a booking or a vehicle, so they lose access;
-- signed-in users (whose inserts may call these from defaults and triggers)
-- keep it.

do $do$
begin
  if exists (select 1 from pg_proc where proname = 'generate_booking_ref' and pronamespace = 'public'::regnamespace) then
    revoke all on function public.generate_booking_ref() from public, anon;
    grant execute on function public.generate_booking_ref() to authenticated;
  end if;

  if exists (select 1 from pg_proc where proname = 'generate_vehicle_slug' and pronamespace = 'public'::regnamespace) then
    revoke all on function public.generate_vehicle_slug(text, text, int) from public, anon;
    grant execute on function public.generate_vehicle_slug(text, text, int) to authenticated;
  end if;
end;
$do$;


-- ─────────────────────────────────────────────────────────────
-- 5. A failed identity check blocks confirmation
-- ─────────────────────────────────────────────────────────────
-- The self-service flow lets a customer step forward to 'confirmed' while
-- review is still pending — a deliberate choice, because the vehicle is only
-- released once documents clear. But nothing stopped a booking whose
-- documents had definitively FAILED from being confirmed too, and
-- confirmation is what awards loyalty points. Staff can still confirm one by
-- hand if a failure was wrong.

create or replace function public.block_confirm_after_failed_verification()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if is_staff() then
    return new;
  end if;

  if exists (
    select 1 from booking_applicants
     where booking_id = new.id
       and verification_status = 'failed'
  ) then
    raise exception 'This booking cannot be confirmed because identity verification failed. Please contact us.';
  end if;

  return new;
end;
$fn$;

drop trigger if exists block_confirm_after_failed_verification on public.bookings;
create trigger block_confirm_after_failed_verification
  before update on public.bookings
  for each row
  when (new.status = 'confirmed' and old.status is distinct from new.status)
  execute function public.block_confirm_after_failed_verification();


-- ─────────────────────────────────────────────────────────────
-- 6. Length caps on free text
-- ─────────────────────────────────────────────────────────────
-- These columns are written straight from the browser through the API, and
-- had no upper bound, so one request could store megabytes in a field an
-- admin screen then renders. The form limits were the only limit.
--
-- NOT VALID: applies to every new insert and update without failing on any
-- existing row. Only plain text columns are touched; a column that is
-- missing, or is an array, is skipped rather than erroring.

do $do$
declare
  r record;
begin
  for r in
    select * from (values
      ('profiles',           'full_name',              200),
      ('profiles',           'suspension_reason',     1000),
      ('partners',           'business_name',          200),
      ('partners',           'business_email',         254),
      ('vehicles',           'make',                    60),
      ('vehicles',           'model',                   80),
      ('vehicles',           'license_plate',           20),
      ('vehicles',           'location',               120),
      ('vehicles',           'description',           5000),
      ('vehicles',           'rejection_reason',      1000),
      ('bookings',           'pickup_point',           200),
      ('bookings',           'destination',            200),
      ('bookings',           'dropoff_point',          200),
      ('identity_documents', 'review_reason',         1000),
      ('booking_applicants', 'license_number',          40),
      ('booking_applicants', 'address',                500),
      ('booking_applicants', 'phone_number',            40),
      ('booking_applicants', 'guarantor_name',         120),
      ('booking_applicants', 'guarantor_phone',         40),
      ('booking_applicants', 'guarantor_relationship',  60),
      ('booking_applicants', 'agreement_signed_name',  200),
      ('booking_applicants', 'full_name',              200),
      ('booking_applicants', 'middle_name',             50),
      ('booking_applicants', 'nationality',             60),
      ('quote_requests',     'business_name',          200),
      ('quote_requests',     'contact_email',          254),
      ('quote_requests',     'contact_phone',           40),
      ('quote_requests',     'notes',                 4000),
      ('document_reviews',   'reason',                1000),
      ('vehicle_documents',  'review_reason',         1000)
    ) as t(tbl, col, max_len)
  loop
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name   = r.tbl
         and column_name  = r.col
         and data_type    = 'text'
    ) and not exists (
      select 1 from pg_constraint
       where conname = format('%s_%s_max_len', r.tbl, r.col)
    ) then
      execute format(
        'alter table public.%I add constraint %I check (%I is null or char_length(%I) <= %s) not valid',
        r.tbl, format('%s_%s_max_len', r.tbl, r.col), r.col, r.col, r.max_len
      );
    end if;
  end loop;
end;
$do$;
