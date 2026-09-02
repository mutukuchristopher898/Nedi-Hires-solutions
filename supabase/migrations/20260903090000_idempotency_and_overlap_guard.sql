-- Double-submission and duplicate-booking protection (reservation spec §5).

-- §5.1 — idempotency key, partial unique index (existing rows have null, unaffected)
alter table bookings add column if not exists idempotency_key uuid;
create unique index if not exists idx_booking_idempotency
  on bookings (idempotency_key) where idempotency_key is not null;

-- §5.2 — overlap check. Mirrors the existing find_duplicate_id_number()
-- security-definer pattern so it can read across other customers' bookings
-- without exposing those rows directly via RLS. Uses start_date/end_date
-- (a `date` column, present since the very first migration) rather than
-- the newer pickup_at/dropoff_at timestamptz columns, since those may not
-- be applied in every environment yet.
create or replace function find_overlapping_active_booking(
  p_id_number_normalized text,
  p_start date,
  p_end date,
  p_exclude_booking_id uuid
)
returns table (booking_id uuid, booking_ref text)
language sql
security definer set search_path = public
stable
as $$
  select b.id, b.booking_ref
  from bookings b
  join booking_applicants a on a.booking_id = b.id
  where a.id_number_normalized = p_id_number_normalized
    and b.id <> p_exclude_booking_id
    and b.status in ('deposit_pending', 'verification_pending', 'settlement_pending', 'confirmed')
    and b.start_date <= p_end
    and b.end_date >= p_start
  limit 1;
$$;

grant execute on function find_overlapping_active_booking(text, date, date, uuid) to authenticated;
