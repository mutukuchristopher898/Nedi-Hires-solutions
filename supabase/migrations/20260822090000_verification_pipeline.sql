-- Automated verification pipeline: status tracking, guarantor-not-self
-- guard, a selfie doc type, and a least-privilege duplicate-ID lookup.

alter table booking_applicants
  add column verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'needs_review', 'failed')),
  add column verification_notes text;

-- Added NOT VALID so it doesn't fail against any existing test rows; still
-- enforced for every new insert/update going forward.
alter table booking_applicants
  add constraint guarantor_not_self
  check (lower(trim(guarantor_name)) <> lower(trim(full_name))) not valid;

alter table identity_documents drop constraint if exists identity_documents_doc_type_check;
alter table identity_documents add constraint identity_documents_doc_type_check
  check (doc_type in ('International Passport', 'Driver''s License', 'National ID', 'Passport Photo', 'Selfie Verification'));

-- Lets an authenticated customer's own session check for duplicate ID
-- numbers across OTHER accounts without ever exposing those accounts' rows
-- (RLS still fully protects booking_applicants select/update) — mirrors the
-- existing is_admin() security-definer pattern.
create function find_duplicate_id_number(p_id_number text, p_exclude_customer_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from booking_applicants
    where id_number = p_id_number and customer_id <> p_exclude_customer_id
  );
$$;

grant execute on function find_duplicate_id_number(text, uuid) to authenticated;
