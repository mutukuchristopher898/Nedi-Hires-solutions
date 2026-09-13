-- Account lifecycle: suspension and erasure.
--
-- On suspension, an honest description of what this can and cannot do.
-- signInWithPassword goes from the browser to Supabase Auth directly, so
-- nothing here can stop a token being issued. What it can do is make the
-- account useless: every server guard refuses it, and RLS refuses its writes.
-- The token remains valid until it expires; it just cannot do anything with it.
--
-- On erasure, the brief asks for anonymisation rather than deletion, which is
-- right: bookings and their money have to survive for accounting, and a hard
-- delete would cascade them away.

alter table public.profiles
  add column if not exists suspended_at       timestamptz,
  add column if not exists suspension_reason  text,
  add column if not exists anonymised_at      timestamptz;

create or replace function public.is_suspended()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and suspended_at is not null
  );
$$;

grant execute on function public.is_suspended() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- A suspended account cannot start anything new
--
-- Enforced on the write policies rather than only in the application, because
-- the application is not in the path: the booking insert goes straight to
-- PostgREST. Reads are deliberately left alone — someone suspended should
-- still be able to see the hire they already have.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Customers can create their own bookings" on public.bookings;
create policy "Customers can create their own bookings" on public.bookings
  for insert to authenticated
  with check (auth.uid() = customer_id and not is_suspended());

drop policy if exists "Anyone can submit a contact message" on public.contact_messages;
create policy "Anyone can submit a contact message" on public.contact_messages
  for insert to anon, authenticated
  with check (auth.uid() is null or not is_suspended());

drop policy if exists "Partners can submit vehicles for their own partner account" on public.vehicles;
create policy "Partners can submit vehicles for their own partner account" on public.vehicles
  for insert to authenticated
  with check (
    not is_suspended()
    and partner_id in (select id from public.partners where owner_profile_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Erasure
--
-- Keeps the booking and financial record, scrubs the person from it. Runs as
-- definer because it writes across tables the caller's own policies would not
-- reach, and checks is_admin() itself rather than trusting the caller.
--
-- Storage objects are NOT removed here — SQL cannot reach the storage API.
-- The route that calls this deletes the files first and passes the count, so
-- the audit trail records how many went rather than implying none existed.
-- ─────────────────────────────────────────────────────────────

create or replace function public.anonymise_account(
  p_profile_id      uuid,
  p_documents_erased int default 0
)
returns void
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_ref text;
begin
  if not is_admin() then
    raise exception 'Only an admin can erase an account';
  end if;

  if p_profile_id = auth.uid() then
    raise exception 'You cannot erase your own account from here';
  end if;

  -- An erasure in the middle of a hire loses the only record of who has the
  -- vehicle. Refused, with the booking named so it can be resolved first.
  select b.booking_ref into v_ref
  from bookings b
  where b.customer_id = p_profile_id
    and b.status <> 'cancelled'
    and b.end_date >= current_date
  order by b.start_date
  limit 1;

  if v_ref is not null then
    raise exception
      'This customer has an active or upcoming hire (%). Resolve or cancel it before erasing the account.', v_ref
      using errcode = '23514', hint = 'account_has_bookings';
  end if;

  -- The profile itself. A marker rather than NULL, so a reader can tell
  -- "erased" from "never filled in".
  update profiles
  set full_name         = 'Erased account',
      email             = null,
      phone             = null,
      anonymised_at     = now(),
      suspended_at      = coalesce(suspended_at, now()),
      suspension_reason = coalesce(suspension_reason, 'Account erased at the customer''s request')
  where id = p_profile_id;

  -- The KYC record attached to their bookings: the identity data, not the
  -- booking. Amounts, dates and vehicle stay, so the accounts still balance.
  -- Columns that are NOT NULL get a marker rather than null: address,
  -- phone_number, guarantor_name, guarantor_phone and id_number all still
  -- carry their original constraints, so nulling them would simply fail and
  -- the erasure would not happen at all.
  update booking_applicants
  set full_name            = 'Erased',
      surname              = null,
      given_names          = null,
      middle_name          = null,
      id_number            = 'ERASED',
      id_number_normalized = null,
      license_number       = null,
      license_issue_date   = null,
      date_of_birth        = null,
      address              = 'Erased',
      phone_number         = 'Erased',
      guarantor_name       = 'Erased',
      guarantor_phone      = 'Erased'
  where customer_id = p_profile_id;

  -- The document rows go entirely; their files were removed by the caller.
  delete from identity_documents where customer_id = p_profile_id;

  -- Recorded explicitly: the triggers capture column diffs, but an erasure is
  -- a deliberate act and should read as one in the log.
  insert into admin_audit_log (actor_id, actor_email, actor_role, action, entity_type, entity_id, changes)
  select auth.uid(), p.email, p.role, 'update', 'profiles', p_profile_id::text,
         jsonb_build_object(
           'erased', jsonb_build_object('from', false, 'to', true),
           'documents_erased', jsonb_build_object('from', null, 'to', p_documents_erased)
         )
  from profiles p where p.id = auth.uid();
end;
$fn$;

revoke all on function public.anonymise_account(uuid, int) from public;
grant execute on function public.anonymise_account(uuid, int) to authenticated;
