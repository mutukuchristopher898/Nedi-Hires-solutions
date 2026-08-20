-- Trip details, KYC/guarantor applicant data, and a signed rental agreement
-- for the real reservation flow (previously a 4-step demo).

alter table bookings
  add column pickup_point text,
  add column destination text,
  add column purpose text check (purpose in ('personal', 'commercial')),
  add column drive_type text check (drive_type in ('self_drive', 'chauffeur'));

-- ─────────────────────────────────────────────────────────────
-- Applicant KYC, guarantor, and agreement sign-off (1:1 with a booking)
-- ─────────────────────────────────────────────────────────────
create table booking_applicants (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  date_of_birth date not null,
  id_type text not null check (id_type in ('International Passport', 'National ID')),
  id_number text not null,
  license_number text,
  license_issue_date date,
  address text not null,
  phone_number text not null,
  guarantor_name text not null,
  guarantor_phone text not null,
  guarantor_relationship text not null,
  agreement_accepted boolean not null default false,
  agreement_signed_name text,
  agreement_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table booking_applicants enable row level security;

create policy "Customers can view their own applicant details" on booking_applicants
  for select using (auth.uid() = customer_id);

create policy "Customers can create their own applicant details" on booking_applicants
  for insert with check (auth.uid() = customer_id);

create policy "Customers can update their own applicant details" on booking_applicants
  for update using (auth.uid() = customer_id);

create policy "Admins can view all applicant details" on booking_applicants
  for select using (is_admin());

create policy "Admins can update all applicant details" on booking_applicants
  for update using (is_admin());

-- ─────────────────────────────────────────────────────────────
-- Allow the passport photo as a 4th identity_documents doc_type
-- ─────────────────────────────────────────────────────────────
alter table identity_documents drop constraint if exists identity_documents_doc_type_check;
alter table identity_documents add constraint identity_documents_doc_type_check
  check (doc_type in ('International Passport', 'Driver''s License', 'National ID', 'Passport Photo'));

-- ─────────────────────────────────────────────────────────────
-- Server-side eligibility guard: the client-side check in the wizard can be
-- bypassed by a direct API call, so re-check self-drive age/experience here.
-- ─────────────────────────────────────────────────────────────
create function check_driver_eligibility()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_drive_type text;
begin
  select drive_type into v_drive_type from bookings where id = new.booking_id;

  if v_drive_type = 'self_drive' then
    if new.date_of_birth > (current_date - interval '27 years')::date then
      raise exception 'Self-drive hirer must be at least 27 years old';
    end if;

    if new.license_issue_date is null or new.license_issue_date > (current_date - interval '3 years')::date then
      raise exception 'Self-drive hirer must have at least 3 years of driving license experience';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_driver_eligibility
  before insert or update on booking_applicants
  for each row execute procedure check_driver_eligibility();

-- ─────────────────────────────────────────────────────────────
-- Private storage bucket for ID/license/passport-photo uploads
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

create policy "kyc_documents_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "kyc_documents_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "kyc_documents_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc-documents' and is_admin());
