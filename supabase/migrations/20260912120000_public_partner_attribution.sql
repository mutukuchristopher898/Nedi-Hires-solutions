-- Partner attribution on public listings, and the data behind the "our partner
-- network" and fleet-statistic sections.
--
-- The problem: vehicles.partner_id joins to partners, but partners has no
-- public select policy — only the owner and admins can read it. So for an
-- anonymous visitor the join returns null and a listing shows no operator at
-- all. Everyone browsing search is anonymous, so attribution was effectively
-- never shown.
--
-- Opening partners publicly is not the fix. RLS is per-row, not per-column,
-- so a public select policy would also expose business_email,
-- tax_credential_url and id_document_url. The business name is the only part
-- meant to be public, and vehicles.partner_name already exists to carry it —
-- the seeded rows use it that way. This just keeps it filled automatically.

create or replace function public.set_vehicle_partner_name()
returns trigger
language plpgsql
security definer set search_path = public   -- reads partners, which the
                                            -- public cannot select
as $fn$
begin
  if new.partner_id is not null then
    select p.business_name
      into new.partner_name
    from public.partners p
    where p.id = new.partner_id;
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_set_vehicle_partner_name on public.vehicles;
create trigger trg_set_vehicle_partner_name
  before insert or update of partner_id on public.vehicles
  for each row execute function public.set_vehicle_partner_name();

-- A business that renames itself should not leave stale attribution on its
-- listings.
create or replace function public.sync_partner_name_to_vehicles()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
begin
  update public.vehicles
  set partner_name = new.business_name
  where partner_id = new.id;

  return new;
end;
$fn$;

drop trigger if exists trg_sync_partner_name_to_vehicles on public.partners;
create trigger trg_sync_partner_name_to_vehicles
  after update of business_name on public.partners
  for each row
  when (old.business_name is distinct from new.business_name)
  execute function public.sync_partner_name_to_vehicles();

-- Backfill anything already submitted. No-op on a database where no partner
-- has listed yet, and correct if one has.
update public.vehicles v
set partner_name = p.business_name
from public.partners p
where v.partner_id = p.id
  and v.partner_name is distinct from p.business_name;
