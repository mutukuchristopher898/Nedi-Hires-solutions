-- Foreign-national support and server-side structural guards for the
-- applicant KYC fields (name/ID/phone validation spec §0-4). The real
-- per-country tiered regex + checksum enforcement lives in
-- src/lib/documentValidation/ and runs in /api/submit-applicant — a
-- 240-country rule table is not something to replicate in SQL. These
-- constraints are a coarse, universal belt-and-suspenders net that fires
-- regardless of which path wrote the row (added NOT VALID so existing rows,
-- written before this migration, aren't retroactively checked).

alter table booking_applicants
  add column nationality text not null default 'KE',
  add column surname text,
  add column given_names text,
  add column middle_name text,
  add column mononym_declared boolean not null default false,
  add column id_number_normalized text;

alter table booking_applicants
  add constraint applicant_nationality_shape check (nationality ~ '^[A-Z]{2}$') not valid;

alter table booking_applicants
  add constraint applicant_id_number_length check (char_length(id_number) between 6 and 20) not valid;

alter table booking_applicants
  add constraint applicant_id_number_has_digit check (id_number ~ '[0-9]') not valid;

alter table booking_applicants
  add constraint applicant_id_number_not_repeated_char check (id_number !~ '^(.)\1*$') not valid;

alter table booking_applicants
  add constraint applicant_id_number_not_same_as_phone
  check (lower(trim(id_number)) <> lower(trim(phone_number))) not valid;

alter table booking_applicants
  add constraint applicant_name_fields_length
  check (
    (surname is null or char_length(trim(surname)) between 2 and 50) and
    (given_names is null or char_length(trim(given_names)) between 2 and 50)
  ) not valid;

alter table booking_applicants
  add constraint applicant_name_fields_no_digits
  check (
    (surname is null or surname !~ '[0-9]') and
    (given_names is null or given_names !~ '[0-9]')
  ) not valid;

alter table booking_applicants
  add constraint applicant_name_fields_not_repeated_char
  check (
    (surname is null or surname !~ '(.)\1{2,}') and
    (given_names is null or given_names !~ '(.)\1{2,}')
  ) not valid;

-- find_duplicate_id_number previously compared raw id_number values, so
-- e.g. "AB-123" and "AB123" wouldn't be caught as the same document once
-- normalisation (strip separators/case) was introduced. Compare on the
-- normalised column instead; existing rows have it backfilled to their
-- current raw value as a reasonable approximation (they predate
-- normalisation, so no separators to strip in practice).
update booking_applicants set id_number_normalized = upper(regexp_replace(id_number, '[\s\-./]', '', 'g'))
where id_number_normalized is null;

create or replace function find_duplicate_id_number(p_id_number text, p_exclude_customer_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from booking_applicants
    where id_number_normalized = upper(regexp_replace(p_id_number, '[\s\-./]', '', 'g'))
      and customer_id <> p_exclude_customer_id
  );
$$;
