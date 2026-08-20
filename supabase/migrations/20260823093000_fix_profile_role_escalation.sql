-- SECURITY FIX: "Profiles are editable by their owner" (for update using
-- auth.uid() = id) has no WITH CHECK restricting which columns change,
-- which means any signed-in customer can currently PATCH their own
-- profiles.role to 'admin' via a direct REST call and pass every
-- requireRole(["admin"]) guard in the app. Verified exploitable.
--
-- Fix: a trigger blocking any role change that isn't performed by an
-- existing admin (dashboard SQL-editor admin promotions are unaffected,
-- since those run outside RLS/application auth entirely).

create function prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change a profile''s role';
  end if;
  return new;
end;
$$;

create trigger prevent_role_self_escalation
  before update on profiles
  for each row
  when (old.role is distinct from new.role)
  execute procedure prevent_role_self_escalation();
