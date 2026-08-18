-- Nedi Hires Solutions - core schema
-- Mirrors src/lib/types.ts. Enums use text + check constraints for easy iteration.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Profiles (one row per auth.users, created via trigger below)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'partner', 'admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by their owner" on profiles
  for select using (auth.uid() = id);

create policy "Profiles are editable by their owner" on profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Partners (fleet operators, tour agencies, private hosts)
-- ─────────────────────────────────────────────────────────────
create table partners (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references profiles (id) on delete cascade,
  business_name text not null,
  business_email text,
  tax_credential_url text,
  id_document_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table partners enable row level security;

create policy "Partners are viewable by their owner" on partners
  for select using (auth.uid() = owner_profile_id);

create policy "Partners can be created by their owner" on partners
  for insert with check (auth.uid() = owner_profile_id);

create policy "Partners are editable by their owner" on partners
  for update using (auth.uid() = owner_profile_id);

-- ─────────────────────────────────────────────────────────────
-- Vehicles (internal fleet when partner_id is null)
-- ─────────────────────────────────────────────────────────────
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners (id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  classification text not null check (classification in ('Economy', 'SUV', 'Luxury', 'Bus', 'Road-Trip Van')),
  fuel_type text not null check (fuel_type in ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
  transmission text not null check (transmission in ('Automatic', 'Manual')),
  capacity int not null,
  license_plate text not null,
  location text not null,
  price_per_day numeric(10, 2) not null,
  currency text not null default 'KES' check (currency in ('KES', 'USD', 'EUR', 'GBP')),
  image_key text not null default 'econ',
  features text[] not null default '{}',
  description text not null default '',
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index vehicles_approval_status_idx on vehicles (approval_status);
create index vehicles_classification_idx on vehicles (classification);

alter table vehicles enable row level security;

create policy "Approved vehicles are publicly viewable" on vehicles
  for select using (approval_status = 'approved');

create policy "Partners can view their own vehicles regardless of status" on vehicles
  for select using (
    partner_id in (select id from partners where owner_profile_id = auth.uid())
  );

create policy "Partners can submit vehicles for their own partner account" on vehicles
  for insert with check (
    partner_id in (select id from partners where owner_profile_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- Bookings (two-tiered payment & verification workflow)
-- ─────────────────────────────────────────────────────────────
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique default ('BK-' || floor(random() * 89999 + 10000)::text),
  customer_id uuid not null references profiles (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id),
  start_date date not null,
  end_date date not null,
  status text not null default 'deposit_pending'
    check (status in ('deposit_pending', 'verification_pending', 'settlement_pending', 'confirmed', 'cancelled')),
  deposit_amount numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  security_deposit numeric(10, 2) not null default 0,
  currency text not null default 'KES' check (currency in ('KES', 'USD', 'EUR', 'GBP')),
  created_at timestamptz not null default now()
);

create index bookings_customer_id_idx on bookings (customer_id);
create index bookings_vehicle_id_idx on bookings (vehicle_id);

alter table bookings enable row level security;

create policy "Customers can view their own bookings" on bookings
  for select using (auth.uid() = customer_id);

create policy "Customers can create their own bookings" on bookings
  for insert with check (auth.uid() = customer_id);

create policy "Customers can update their own bookings" on bookings
  for update using (auth.uid() = customer_id);

-- ─────────────────────────────────────────────────────────────
-- Identity documents (passport / driver's license / national ID)
-- ─────────────────────────────────────────────────────────────
create table identity_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  doc_type text not null check (doc_type in ('International Passport', 'Driver''s License', 'National ID')),
  file_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz
);

create index identity_documents_booking_id_idx on identity_documents (booking_id);

alter table identity_documents enable row level security;

create policy "Customers can view their own documents" on identity_documents
  for select using (auth.uid() = customer_id);

create policy "Customers can submit their own documents" on identity_documents
  for insert with check (auth.uid() = customer_id);

-- ─────────────────────────────────────────────────────────────
-- Subscription plans + customer subscriptions
-- ─────────────────────────────────────────────────────────────
create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_price numeric(10, 2) not null,
  currency text not null default 'KES' check (currency in ('KES', 'USD', 'EUR', 'GBP')),
  tier_classes text[] not null default '{}',
  swaps_per_month int not null default 1,
  highlight boolean not null default false,
  perks text[] not null default '{}'
);

alter table subscription_plans enable row level security;

create policy "Subscription plans are publicly viewable" on subscription_plans
  for select using (true);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  plan_id uuid not null references subscription_plans (id),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  started_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Customers can view their own subscription" on subscriptions
  for select using (auth.uid() = customer_id);

create policy "Customers can create their own subscription" on subscriptions
  for insert with check (auth.uid() = customer_id);

-- ─────────────────────────────────────────────────────────────
-- Admin override: profiles.role = 'admin' can do anything
-- ─────────────────────────────────────────────────────────────
create function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Admins can view all partners" on partners for select using (is_admin());
create policy "Admins can update all partners" on partners for update using (is_admin());

create policy "Admins can view all vehicles" on vehicles for select using (is_admin());
create policy "Admins can update all vehicles" on vehicles for update using (is_admin());

create policy "Admins can view all bookings" on bookings for select using (is_admin());
create policy "Admins can update all bookings" on bookings for update using (is_admin());

create policy "Admins can view all documents" on identity_documents for select using (is_admin());
create policy "Admins can update all documents" on identity_documents for update using (is_admin());
