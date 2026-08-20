-- Partner custom-quote requests, and a loyalty program (points + tiers).
-- Point-earn rate and tier thresholds below are placeholders — owner-adjustable.

create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid references profiles (id) on delete set null,
  business_name text not null,
  contact_email text not null,
  contact_phone text not null,
  vehicle_count int not null check (vehicle_count > 0),
  vehicle_types text,
  notes text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index quote_requests_status_idx on quote_requests (status);

alter table quote_requests enable row level security;

create policy "Requesters can view their own quote requests" on quote_requests
  for select using (auth.uid() = requester_profile_id);

create policy "Requesters can create their own quote requests" on quote_requests
  for insert with check (auth.uid() = requester_profile_id);

create policy "Admins can view all quote requests" on quote_requests
  for select using (is_admin());

create policy "Admins can update all quote requests" on quote_requests
  for update using (is_admin());

-- ─────────────────────────────────────────────────────────────
-- Loyalty program: points earned per confirmed booking, rolling up into
-- Bronze/Silver/Gold status. No customer insert/update policy on either
-- table below — all writes happen via the trigger, matching the
-- check_driver_eligibility() security-definer precedent.
-- ─────────────────────────────────────────────────────────────
create table loyalty_accounts (
  customer_id uuid primary key references profiles (id) on delete cascade,
  points_balance int not null default 0,
  lifetime_points int not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  updated_at timestamptz not null default now()
);

create table loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  points_delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table loyalty_accounts enable row level security;
alter table loyalty_transactions enable row level security;

create policy "Customers can view their own loyalty account" on loyalty_accounts
  for select using (auth.uid() = customer_id);

create policy "Customers can view their own loyalty transactions" on loyalty_transactions
  for select using (auth.uid() = customer_id);

create policy "Admins can view all loyalty accounts" on loyalty_accounts
  for select using (is_admin());

create policy "Admins can view all loyalty transactions" on loyalty_transactions
  for select using (is_admin());

create function award_loyalty_points_on_confirm()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_points int;
  v_lifetime int;
  v_tier text;
begin
  -- No FX rule exists yet for non-KES bookings; skip rather than award
  -- points at the wrong scale. Every booking today is KES anyway.
  if new.currency <> 'KES' then
    return new;
  end if;

  v_points := floor(new.total_amount / 100);

  insert into loyalty_accounts (customer_id, points_balance, lifetime_points)
  values (new.customer_id, v_points, v_points)
  on conflict (customer_id) do update
    set points_balance = loyalty_accounts.points_balance + v_points,
        lifetime_points = loyalty_accounts.lifetime_points + v_points,
        updated_at = now()
  returning lifetime_points into v_lifetime;

  v_tier := case
    when v_lifetime >= 5000 then 'gold'
    when v_lifetime >= 1500 then 'silver'
    else 'bronze'
  end;

  update loyalty_accounts set tier = v_tier where customer_id = new.customer_id;

  insert into loyalty_transactions (customer_id, booking_id, points_delta, reason)
  values (new.customer_id, new.id, v_points, 'Booking ' || new.booking_ref || ' confirmed');

  return new;
end;
$$;

-- Fires only on the transition into 'confirmed'. Note: a booking cycled
-- confirmed -> cancelled -> confirmed again will award points a second
-- time — treated as a genuine repeat confirmation, not a bug.
create trigger award_loyalty_points
  after update on bookings
  for each row
  when (old.status is distinct from 'confirmed' and new.status = 'confirmed')
  execute procedure award_loyalty_points_on_confirm();
