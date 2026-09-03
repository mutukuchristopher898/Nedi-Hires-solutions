-- ═══════════════════════════════════════════════════════════════════════════
-- Booking money, status and eligibility integrity (audit findings F03-F08)
--
-- Every booking write goes through the RLS-scoped browser client, and the
-- customer UPDATE policies on bookings / booking_applicants restrict only
-- WHICH ROW may be touched, never WHICH COLUMNS. A signed-in customer could
-- therefore PATCH their own booking's total_amount to 1, mint unlimited
-- loyalty points, jump status straight to 'confirmed', and defeat the
-- self-drive age rule.
--
-- None of this is fixable at the policy level: an RLS check expression has no
-- access to OLD, so "this column did not change" is inexpressible. BEFORE
-- triggers are the only mechanism -- the same conclusion 20260823093000
-- reached for profiles.role, which is the template followed throughout.
-- Do not "simplify" any of these guards back into a policy.
--
-- THE STATEMENT ORDER BELOW IS LOAD-BEARING. In particular the backfill must
-- run before both the new CHECK constraints and enforce_booking_money().
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. Rate lock
-- ─────────────────────────────────────────────────────────────
-- Freezes the rate a booking was quoted at, so editing vehicles.price_per_day
-- later cannot retroprice a booking already in flight. Nullable, so purely
-- additive against existing rows; the backfill and trigger below populate it.
alter table bookings add column if not exists rate_per_day numeric(10, 2);


-- ─────────────────────────────────────────────────────────────
-- 2. Server-side pricing rules
-- ─────────────────────────────────────────────────────────────
-- These duplicate, in SQL, the rules in src/lib/duration.ts (effectiveDays,
-- computePricing, oneWayFee, and the two deposit rates) -- KEEP BOTH IN SYNC
-- if any threshold, discount, fee or rate changes. Same
-- duplicate-with-a-sync-comment arrangement as src/lib/eligibility.ts
-- <-> check_driver_eligibility().
--
-- Why duplicated rather than centralised: all booking writes go through the
-- RLS-scoped browser client, so the only place that can be authoritative
-- about money is the database. The client copy is purely for display.

-- effectiveDays(): any partial day bills as a full day.
--
-- No timezone handling is needed or wanted: this is the difference of two
-- absolute instants, which is offset-independent. Africa/Nairobi only matters
-- to combineDateAndTime() on the way in, which the client already applies.
--
-- Two deliberate divergences from the TypeScript:
--   * falls back to end_date - start_date for rows written before
--     20260902120000 added pickup_at/dropoff_at (both still nullable), and
--     for any direct API insert that omits them;
--   * clamps to >= 1 day. The TS returns 0 for a non-positive duration, which
--     in SQL would mean a free rental for anyone posting dropoff_at <=
--     pickup_at. enforce_booking_money() also raises on that outright; this
--     clamp is the belt to that braces.
create or replace function booking_effective_days(
  p_pickup_at  timestamptz,
  p_dropoff_at timestamptz,
  p_start_date date,
  p_end_date   date
)
returns integer
language sql
immutable
as $fn$
  select greatest(
    case
      when p_pickup_at is not null and p_dropoff_at is not null
        then ceil(extract(epoch from (p_dropoff_at - p_pickup_at))::numeric / 86400)::integer
      else (p_end_date - p_start_date)
    end,
    1
  );
$fn$;

-- computePricing(): flat whole-stay discount once a threshold is crossed, not
-- a blended/prorated engine. Thresholds mirror MONTHLY_THRESHOLD_DAYS=28 /
-- WEEKLY_THRESHOLD_DAYS=7 and MONTHLY_DISCOUNT=0.25 / WEEKLY_DISCOUNT=0.1.
-- round() matches JS Math.round for non-negative amounts (both round .5 up);
-- the sub-7-day branch is deliberately unrounded, like the TS.
create or replace function booking_price_total(p_rate numeric, p_days integer)
returns numeric
language sql
immutable
as $fn$
  select case
    when p_days >= 28 then round(p_rate * p_days * 0.75)
    when p_days >= 7  then round(p_rate * p_days * 0.90)
    else                   p_rate * p_days
  end;
$fn$;

-- oneWayFee(): flat, symmetric fee per unordered pair of depots. The
-- empty-string branch mirrors the TS falsy check (!pickup || !dropoff), since
-- trip/page.tsx writes pickup_point into dropoff_point when the customer
-- is not returning to a different location.
create or replace function booking_one_way_fee(p_pickup text, p_dropoff text)
returns numeric
language sql
immutable
as $fn$
  select (case
    when p_pickup is null or p_dropoff is null          then 0
    when btrim(p_pickup) = '' or btrim(p_dropoff) = ''  then 0
    when p_pickup = p_dropoff                           then 0
    else 6000
  end)::numeric;
$fn$;


-- ─────────────────────────────────────────────────────────────
-- 3. Backfill existing bookings' money  (BEFORE steps 4 and 5)
-- ─────────────────────────────────────────────────────────────
-- Before step 4, because Postgres re-checks every CHECK constraint against
-- the new row version of any row an UPDATE touches, even constraints marked
-- NOT VALID. NOT VALID only skips the one-time scan at ALTER time. 77 of the
-- 245 catalogue vehicles price below the old flat KES 5,000 deposit, so those
-- rows violate deposit_within_total today -- adding the constraint first
-- would leave them un-updatable, surfacing days later as a real customer
-- clicking "Pay Deposit". Same reordering lesson as 20260825090000's backfill.
--
-- Before step 5, because enforce_booking_money()'s freeze branch restores the
-- old money whenever no pricing input changed, which would silently undo this
-- entire statement.
--
-- Safe against award_loyalty_points: its WHEN clause requires
-- old.status IS DISTINCT FROM 'confirmed', and this statement does not touch
-- status, so no points are re-awarded.
update bookings b
set rate_per_day     = q.rate,
    currency         = q.currency,
    one_way_fee      = q.fee,
    total_amount     = q.total,
    deposit_amount   = round(q.total * 0.30),
    security_deposit = round(q.total * 0.15)
from (
  select b2.id,
         v.price_per_day as rate,
         v.currency      as currency,
         booking_one_way_fee(b2.pickup_point, b2.dropoff_point) as fee,
         booking_price_total(
           v.price_per_day,
           booking_effective_days(b2.pickup_at, b2.dropoff_at,
                                  b2.start_date, b2.end_date)
         ) + booking_one_way_fee(b2.pickup_point, b2.dropoff_point) as total
  from bookings b2
  join vehicles v on v.id = b2.vehicle_id
) q
where q.id = b.id;


-- ─────────────────────────────────────────────────────────────
-- 4. Amount invariants
-- ─────────────────────────────────────────────────────────────
alter table bookings
  add constraint bookings_amounts_non_negative
  check (total_amount >= 0 and deposit_amount >= 0
         and security_deposit >= 0 and one_way_fee >= 0) not valid;

-- F08: a flat KES 5,000 reservation deposit exceeded the entire rental total
-- on 77 of the 245 catalogue vehicles (anything at KES 3,200-4,000/day hired
-- for a single day), and settlement/page.tsx's Math.max(total - 5000, 0)
-- silently absorbed the overpayment rather than surfacing it. Now that the
-- deposit is a percentage this holds by construction; the constraint exists
-- so it can never silently stop holding.
alter table bookings
  add constraint bookings_deposit_within_total
  check (deposit_amount <= total_amount) not valid;

-- The backfill above has made these true of every existing row, so promote
-- them to real guarantees. Takes only SHARE UPDATE EXCLUSIVE (reads and
-- writes are not blocked) and the table is small.
alter table bookings validate constraint bookings_amounts_non_negative;
alter table bookings validate constraint bookings_deposit_within_total;


-- ─────────────────────────────────────────────────────────────
-- 5. Money is derived server-side, never accepted from the client
-- ─────────────────────────────────────────────────────────────
-- OVERWRITES rather than validates: whatever the client sends is discarded
-- and the authoritative figures are derived from vehicles.price_per_day. This
-- needs no new Route Handler, and makes the browser-side computation in
-- src/app/booking/[id]/trip/page.tsx a harmless display estimate.
create or replace function enforce_booking_money()
returns trigger
language plpgsql
security definer set search_path = public   -- reads vehicles, which is RLS-protected
as $fn$
declare
  v_rate     numeric(10, 2);
  v_currency text;
  v_days     integer;
  v_fee      numeric;
  v_total    numeric;
  v_repriced boolean;
begin
  if tg_op = 'UPDATE' then
    v_repriced :=
         new.vehicle_id    is distinct from old.vehicle_id
      or new.pickup_at     is distinct from old.pickup_at
      or new.dropoff_at    is distinct from old.dropoff_at
      or new.start_date    is distinct from old.start_date
      or new.end_date      is distinct from old.end_date
      or new.pickup_point  is distinct from old.pickup_point
      or new.dropoff_point is distinct from old.dropoff_point;

    if not v_repriced then
      -- An admin may correct amounts by hand (goodwill discount, data fix).
      if is_admin() then
        return new;
      end if;

      -- Nothing feeding the price moved, so the quote is frozen: put back
      -- whatever was stored and ignore any money the caller tried to send.
      -- This is what makes the agreement step and all three status flips
      -- provably no-ops on money, rather than "recompute happens to agree".
      --
      -- Deliberately silent, not raising: PostgREST sends only the columns in
      -- the request body, so {status: 'confirmed'} legitimately arrives with
      -- the money columns unchanged, and raising would be pure noise.
      --
      -- NOTE: prevent_booking_field_tampering() below relies on this branch
      -- and therefore does NOT guard the money columns itself. If this
      -- early-return is ever narrowed, add them there.
      new.total_amount     := old.total_amount;
      new.deposit_amount   := old.deposit_amount;
      new.security_deposit := old.security_deposit;
      new.one_way_fee      := old.one_way_fee;
      new.rate_per_day     := old.rate_per_day;
      new.currency         := old.currency;
      return new;
    end if;
  end if;

  select v.price_per_day, v.currency
    into v_rate, v_currency
  from vehicles v
  where v.id = new.vehicle_id;

  if v_rate is null then
    raise exception 'Cannot price a booking against an unknown vehicle';
  end if;

  -- Rate lock: an existing booking keeps the rate it was quoted at, so
  -- editing vehicles.price_per_day never silently reprices bookings already
  -- in flight (which, because award_loyalty_points reads new.total_amount on
  -- the settlement -> confirmed flip, would also mis-award points).
  if tg_op = 'UPDATE' and old.rate_per_day is not null
     and new.vehicle_id = old.vehicle_id then
    v_rate     := old.rate_per_day;
    v_currency := old.currency;
  end if;

  if new.pickup_at is not null and new.dropoff_at is not null
     and new.dropoff_at <= new.pickup_at then
    raise exception 'Drop-off must be after pickup';
  end if;

  v_days := booking_effective_days(new.pickup_at, new.dropoff_at,
                                   new.start_date, new.end_date);

  -- MAX_RENTAL_DAYS in src/lib/duration.ts. TripDetailsStep.tsx already
  -- blocks this client-side; nothing enforced it server-side until now.
  if v_days > 90 then
    raise exception 'The maximum rental period is 90 days';
  end if;

  v_fee   := booking_one_way_fee(new.pickup_point, new.dropoff_point);
  v_total := booking_price_total(v_rate, v_days) + v_fee;

  new.rate_per_day := v_rate;
  -- Overwritten too: award_loyalty_points_on_confirm() skips non-KES
  -- bookings, so a client-chosen currency was a (dormant, since every
  -- vehicle is KES today) way to steer the points calculation.
  new.currency     := v_currency;
  new.one_way_fee  := v_fee;
  new.total_amount := v_total;

  -- RESERVATION_DEPOSIT_RATE (0.30) and SECURITY_DEPOSIT_RATE (0.15) in
  -- src/lib/duration.ts. Two different things: the reservation deposit is a
  -- slice of the rental total taken up front to hold the vehicle; the
  -- security deposit is refundable and held on top at handover.
  new.deposit_amount   := round(v_total * 0.30);
  new.security_deposit := round(v_total * 0.15);

  return new;
end;
$fn$;

create trigger enforce_booking_money
  before insert or update on bookings
  for each row execute procedure enforce_booking_money();

-- To correct amounts by hand later: auth.uid() is NULL in the SQL Editor, so
-- is_admin() is false there and the freeze branch applies to hand-written SQL
-- too. Disable the trigger around the corrective statement:
--   alter table bookings disable trigger enforce_booking_money;
--   ... corrective UPDATE ...
--   alter table bookings enable trigger enforce_booking_money;


-- ─────────────────────────────────────────────────────────────
-- 6. Structural column guards
-- ─────────────────────────────────────────────────────────────
create or replace function prevent_booking_field_tampering()
returns trigger
language plpgsql
security definer set search_path = public   -- reads booking_applicants (RLS-protected)
as $fn$
declare
  v_has_applicant boolean;
begin
  if is_admin() then
    return new;
  end if;

  -- Structural identity. customer_id is in fact already protected: an UPDATE
  -- policy with no WITH CHECK reuses its USING expression as the check, so
  -- auth.uid() = customer_id is enforced post-update. Listed anyway so the
  -- intent survives any future policy edit.
  if new.id                 is distinct from old.id
     or new.booking_ref     is distinct from old.booking_ref
     or new.customer_id     is distinct from old.customer_id
     or new.vehicle_id      is distinct from old.vehicle_id
     or new.idempotency_key is distinct from old.idempotency_key
     or new.created_at      is distinct from old.created_at then
    raise exception 'This field cannot be changed after the booking is created';
  end if;

  -- SECURITY FIX (F06): self-drive eligibility is only ever checked when a
  -- booking_applicants row is written (check_driver_eligibility reads
  -- bookings.drive_type and short-circuits for 'chauffeur'). So: create the
  -- booking as chauffeur, submit applicant details (no checks run), sign the
  -- agreement, THEN flip drive_type to 'self_drive'. Nothing re-checked.
  --
  -- Blocking the flip once an applicant row exists is preferred over
  -- re-running the age/licence rules here: it needs no third copy of the
  -- thresholds and cannot be defeated by a NULL date_of_birth. Flipping
  -- drive_type BEFORE the applicant row exists stays allowed and is safe,
  -- because the applicant INSERT then runs the eligibility check against the
  -- correct drive_type. One deliberate over-reach: this also blocks the
  -- harmless self_drive -> chauffeur downgrade. Accepted for simplicity.
  if new.drive_type is distinct from old.drive_type then
    select true into v_has_applicant
    from booking_applicants where booking_id = old.id limit 1;

    if coalesce(v_has_applicant, false) then
      raise exception
        'Drive type cannot be changed after applicant details have been submitted';
    end if;
  end if;

  return new;
end;
$fn$;

create trigger prevent_booking_field_tampering
  before update on bookings
  for each row execute procedure prevent_booking_field_tampering();


create or replace function prevent_applicant_field_tampering()
returns trigger
language plpgsql            -- no security definer needed: OLD/NEW + is_admin() only
set search_path = public
as $fn$
begin
  if is_admin() then
    return new;
  end if;

  if new.id             is distinct from old.id
     or new.booking_id  is distinct from old.booking_id
     or new.customer_id is distinct from old.customer_id
     or new.created_at  is distinct from old.created_at then
    raise exception 'This field cannot be changed after applicant details are submitted';
  end if;

  -- SECURITY FIX (part of F05): the agreement sign-off is write-once. The
  -- customer legitimately sets all three at the agreement step
  -- (src/app/booking/[id]/agreement/page.tsx), but there is no legitimate
  -- second write anywhere in the codebase -- so re-signing under a different
  -- name, back-dating the acceptance, or un-accepting it after the fact is
  -- always forgery. All three are frozen together: freezing the name but not
  -- the timestamp would still allow back-dating a signature.
  if old.agreement_accepted then
    if new.agreement_accepted       is distinct from old.agreement_accepted
       or new.agreement_signed_name is distinct from old.agreement_signed_name
       or new.agreement_accepted_at is distinct from old.agreement_accepted_at then
      raise exception 'The signed rental agreement cannot be changed';
    end if;
  end if;

  return new;
end;
$fn$;

create trigger prevent_applicant_field_tampering
  before update on booking_applicants
  for each row execute procedure prevent_applicant_field_tampering();


-- ─────────────────────────────────────────────────────────────
-- 7. Status transitions: single forward steps only
-- ─────────────────────────────────────────────────────────────
-- SECURITY FIX (F03/F04): a customer could PATCH status straight to
-- 'confirmed' from 'deposit_pending', skipping KYC, the agreement,
-- verification and settlement -- and in the same statement fire
-- award_loyalty_points on a total they had also just rewritten.
--
-- Deliberately NOT admin-only confirmation: there is no payment gateway yet,
-- so the existing self-service flow (deposit, verification and settlement
-- pages) must keep working, and each of those is exactly one forward step.
--
-- Note for the next reader: 20260823091000's comment about a
-- confirmed -> cancelled -> confirmed cycle re-awarding points now describes
-- an admin-only path, since 'cancelled' is unreachable from 'confirmed' for a
-- non-admin. No app code writes 'cancelled' at all today.
create or replace function enforce_booking_status_transition()
returns trigger
language plpgsql            -- no security definer needed
set search_path = public
as $fn$
declare
  v_allowed text[];
begin
  if is_admin() then
    return new;
  end if;

  v_allowed := case old.status
    when 'deposit_pending'      then array['verification_pending', 'cancelled']
    when 'verification_pending' then array['settlement_pending',   'cancelled']
    when 'settlement_pending'   then array['confirmed',            'cancelled']
    else array[]::text[]     -- confirmed and cancelled are terminal
  end;

  if not (new.status = any (v_allowed)) then
    raise exception 'A booking cannot move from % to %', old.status, new.status;
  end if;

  return new;
end;
$fn$;

-- The WHEN clause means a no-op re-submit (double-click, or backward wizard
-- navigation followed by re-clicking the same step's button) never fires the
-- trigger at all, so it stays allowed.
create trigger enforce_booking_status_transition
  before update on bookings
  for each row
  when (old.status is distinct from new.status)
  execute procedure enforce_booking_status_transition();


-- ─────────────────────────────────────────────────────────────
-- 8. Close the NULL date-of-birth eligibility bypass
-- ─────────────────────────────────────────────────────────────
-- Two fixes, no signature change (the enforce_driver_eligibility trigger from
-- 20260820120000 keeps pointing here).
--
-- (1) A NULL date_of_birth bypassed the age check entirely. date_of_birth
--     became nullable in 20260821090000 because chauffeur bookings do not
--     collect it, but the age test is `new.date_of_birth > (...)`, which is
--     NULL when DOB is NULL -- and PL/pgSQL treats a NULL IF condition as
--     false, so no exception was raised. There was no TypeScript backstop
--     either: validateApplicantPayload() never inspects dateOfBirth or
--     licenseIssueDate, so a direct POST /api/submit-applicant with
--     dateOfBirth:null and a >=3-year-old licence date passed both layers on
--     a self_drive booking.
--
-- (2) The rules now only run when the dates they judge are actually being
--     written. The trigger is BEFORE INSERT OR UPDATE, so it previously
--     re-ran on every unrelated update to the row. With (1) tightened, that
--     would make any pre-existing self_drive row with a NULL DOB permanently
--     un-updatable, stranding a real customer mid-flow. The F06 vector this
--     re-run used to cover accidentally is now closed properly on the
--     bookings side by prevent_booking_field_tampering().
create or replace function check_driver_eligibility()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_drive_type text;
begin
  if tg_op = 'UPDATE'
     and new.date_of_birth      is not distinct from old.date_of_birth
     and new.license_issue_date is not distinct from old.license_issue_date then
    return new;
  end if;

  select drive_type into v_drive_type from bookings where id = new.booking_id;

  if v_drive_type = 'self_drive' then
    if new.date_of_birth is null then
      raise exception 'Self-drive hirer must provide a date of birth';
    end if;

    if new.date_of_birth > (current_date - interval '27 years')::date then
      raise exception 'Self-drive hirer must be at least 27 years old';
    end if;

    if new.license_issue_date is null
       or new.license_issue_date > (current_date - interval '3 years')::date then
      raise exception 'Self-drive hirer must have at least 3 years of driving license experience';
    end if;
  end if;

  return new;
end;
$fn$;


-- ─────────────────────────────────────────────────────────────
-- 9. Spell out the implicit RLS WITH CHECK
-- ─────────────────────────────────────────────────────────────
-- No behaviour change: Postgres already reuses an UPDATE policy's USING
-- expression as its check expression when WITH CHECK is omitted. Spelled out
-- because the ABSENCE of WITH CHECK on these two policies is what made F03
-- and F05 look like column-level holes, and because a future reader must
-- understand that column immutability is NOT expressible here (a policy check
-- cannot see OLD) and lives in the triggers above instead.
alter policy "Customers can update their own bookings" on bookings
  using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

alter policy "Customers can update their own applicant details" on booking_applicants
  using (auth.uid() = customer_id) with check (auth.uid() = customer_id);


-- ─────────────────────────────────────────────────────────────
-- 10. Verification-writer capability (closes the F05 forgery)
-- ─────────────────────────────────────────────────────────────
-- Both verification routes authenticate with the anon key plus the customer's
-- own JWT (src/lib/supabase/server.ts), so they execute AS the customer.
-- There is therefore no SQL predicate that separates the route from the
-- browser -- nothing to separate. Closing the hole requires giving the server
-- one capability the browser lacks.
--
-- This is NOT a service_role key. It grants exactly one power: write
-- verification_status / verification_notes for one booking. No RLS bypass
-- anywhere else. It follows the existing SMILE_IDENTITY_API_KEY precedent of
-- a server-only secret that is deliberately not NEXT_PUBLIC_.
--
-- >>> BEFORE PASTING: replace REPLACE_AT_PASTE_TIME below with a long random
-- >>> string, and set the same value as VERIFICATION_WRITER_SECRET in
-- >>> .env.local and in the Vercel project environment.
create table if not exists app_capability_keys (
  name          text primary key,
  secret_sha256 text not null,
  created_at    timestamptz not null default now()
);

alter table app_capability_keys enable row level security;
-- Deliberately NO policies: unreachable through PostgREST for every role,
-- readable only from inside the security-definer function below.

-- pgcrypto is installed (20260818120000) but lives in the `extensions`
-- schema, which `set search_path = public` excludes -- so digest() must be
-- schema-qualified. Same trap applies to any other pgcrypto call inside a
-- hardened function.
insert into app_capability_keys (name, secret_sha256)
values ('verification_writer',
        encode(extensions.digest('REPLACE_AT_PASTE_TIME', 'sha256'), 'hex'))
on conflict (name) do nothing;

create or replace function apply_verification_result(
  p_booking_id    uuid,
  p_status        text,
  p_notes         text,
  p_writer_secret text
)
returns void
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_ok boolean;
begin
  select secret_sha256 = encode(extensions.digest(p_writer_secret, 'sha256'), 'hex')
    into v_ok
  from app_capability_keys where name = 'verification_writer';

  if not coalesce(v_ok, false) then
    raise exception 'Not authorised to write a verification result';
  end if;

  if p_status not in ('pending', 'verified', 'needs_review', 'failed') then
    raise exception 'Unknown verification status %', p_status;
  end if;

  update booking_applicants
     set verification_status = p_status,
         verification_notes  = p_notes
   where booking_id = p_booking_id;
end;
$fn$;

revoke all on function apply_verification_result(uuid, text, text, text) from public;
grant execute on function apply_verification_result(uuid, text, text, text) to authenticated;

-- MUST NOT be security definer: it discriminates on current_user, which is
-- 'authenticated' for a direct PostgREST PATCH and the function owner inside
-- apply_verification_result above. `authenticated` is not a member of the
-- owner role and PostgREST exposes no way to SET ROLE, so the browser cannot
-- forge it. Marking this definer would pin current_user to the owner
-- unconditionally and destroy the discriminator.
create or replace function prevent_verification_status_forgery()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if current_user = 'authenticated' and not is_admin() then
    raise exception
      'verification_status is written by the verification pipeline, not the client';
  end if;
  return new;
end;
$fn$;

create trigger prevent_verification_status_forgery
  before update on booking_applicants
  for each row
  when (old.verification_status is distinct from new.verification_status
        or old.verification_notes  is distinct from new.verification_notes)
  execute procedure prevent_verification_status_forgery();
