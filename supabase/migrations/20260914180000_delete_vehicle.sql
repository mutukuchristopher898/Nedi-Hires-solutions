-- ─────────────────────────────────────────────────────────────
-- Deleting a vehicle outright
--
-- Archiving is the right answer almost every time, and it already exists: a
-- vehicle that has ever been hired belongs to the accounts and must keep
-- existing so its bookings still resolve. bookings.vehicle_id references
-- vehicles(id) with no ON DELETE clause, so Postgres already refuses — but it
-- refuses with a foreign key violation, which is not something to show an
-- operator.
--
-- This is for the other case: a duplicate, a typo, a test row, a partner
-- submission that should never have been made. Archiving those leaves clutter
-- in the fleet list forever.
--
-- There is deliberately no DELETE policy on vehicles for staff or admins.
-- Going through a function instead means the booking check and the delete
-- happen in one transaction, so a booking placed between the screen rendering
-- and the button being pressed still stops it. A policy could not express
-- that.
-- ─────────────────────────────────────────────────────────────

create or replace function public.delete_vehicle(p_vehicle_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_bookings integer;
begin
  -- Admin only. Staff can hide, reject and archive; permanent removal is a
  -- different kind of decision and is not delegated.
  --
  -- Returned rather than raised, like every other outcome here, so the caller
  -- has one shape to handle. A raise would reach the browser as a generic
  -- Postgres error the UI could only pass through verbatim.
  if not is_admin() then
    return 'forbidden';
  end if;

  select count(*) into v_bookings
  from public.bookings
  where vehicle_id = p_vehicle_id;

  if v_bookings > 0 then
    return 'has_bookings';
  end if;

  delete from public.vehicles where id = p_vehicle_id;

  if not found then
    return 'not_found';
  end if;

  -- The audit trigger on vehicles is AFTER DELETE, so this is already
  -- recorded with the acting admin: security definer changes the executing
  -- role, not auth.uid().
  return 'deleted';
end;
$fn$;

comment on function public.delete_vehicle(uuid) is
  'Permanently deletes a vehicle with no bookings. Returns deleted | has_bookings | forbidden | not_found.';

revoke all on function public.delete_vehicle(uuid) from public, anon;
grant execute on function public.delete_vehicle(uuid) to authenticated;
