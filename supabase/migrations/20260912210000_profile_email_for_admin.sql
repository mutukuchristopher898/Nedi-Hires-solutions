-- Put the account's email on the profile, so an admin can see and act on it.
--
-- Emails live in auth.users, which PostgREST does not expose, so the admin
-- area could list people by name but had no way to contact them, identify
-- which account was which, or trigger a password reset for one.
--
-- handle_new_user() already receives new.email and simply discarded it.
--
-- Not a new disclosure: "Admins can view all profiles" (20260904090000)
-- already lets an admin read every profile, and a customer can still only
-- read their own row. This adds a column to rows whose visibility is unchanged.

alter table public.profiles
  add column if not exists email text;

-- Kept in step with auth.users from here on.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

-- Someone changing their email must not leave the profile showing the old one,
-- or an admin would send a reset to an address that no longer signs in.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Backfill every existing account.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

-- ─────────────────────────────────────────────────────────────
-- Admins can update profiles other than their own
--
-- profiles had "Admins can view all profiles" but only "Profiles are editable
-- by their owner" for writes, so an admin changing someone's role matched no
-- rows — and PostgREST reports an update that matched nothing as success, so
-- it would have failed silently.
--
-- Role changes stay governed by prevent_role_self_escalation
-- (20260823093000), which this does not weaken: it already lets an admin
-- change a role and blocks everyone else.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles
  for update to authenticated
  using (is_admin()) with check (is_admin());
