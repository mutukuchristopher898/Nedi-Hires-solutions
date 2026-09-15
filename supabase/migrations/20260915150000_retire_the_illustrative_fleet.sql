-- ─────────────────────────────────────────────────────────────
-- Take the illustrative fleet off the public site
--
-- 257 of the 259 vehicles customers could search and book were demo seed rows.
-- Nothing on a card, a detail page or the booking wizard said so: the catalogue
-- read as real inventory at real prices, and the booking flow would take a
-- customer all the way through for a car that does not exist.
--
-- 169 of them also carried an operator name — "Lakeside Tours & Travel",
-- "Rift Valley Rides", "EastAfrica Group Transit", "Coastal Safari Fleet",
-- "Nairobi Wheels Ltd", "Prestige Motors Kenya" — displayed to customers as
-- "via <name>". The partners table is empty. None of those businesses exist,
-- and attributing a vehicle to an invented firm is not something a label
-- would have made acceptable.
--
-- Hidden rather than deleted or rejected:
--
--   * hidden_at is enforced in the "Approved vehicles are publicly viewable"
--     policy, so this removes them at the database. Not a UI filter that the
--     next query forgets.
--   * Reversible in one statement if the catalogue is wanted later as a
--     starting point for real listings.
--   * Not 'pending', which would drop 257 rows into the approval queue and
--     bury any genuine partner submission arriving behind them.
--   * Not 'archived', which is the state for a vehicle that has left a real
--     fleet and reads as a stronger claim than these deserve.
-- ─────────────────────────────────────────────────────────────

-- ── 1. Off customer search ──────────────────────────────────
update public.vehicles
set hidden_at = now()
where is_demo = true
  and hidden_at is null;

-- ── 2. The invented operators ───────────────────────────────
-- Cleared regardless of visibility. A name nobody can hold to account should
-- not be in the row at all, not merely hidden from view — /admin/vehicles
-- shows it too, and an operator reading it there would have no way to tell it
-- from a real one.
update public.vehicles
set partner_name = null
where is_demo = true
  and partner_name is not null;

-- ── To undo ─────────────────────────────────────────────────
-- Bringing them back is:
--
--   update public.vehicles set hidden_at = null where is_demo = true;
--
-- The operator names are gone for good, which is the intent. The customer
-- facing code now labels any visible is_demo row as an illustrative example,
-- so unhiding one is no longer the silent failure it was.
