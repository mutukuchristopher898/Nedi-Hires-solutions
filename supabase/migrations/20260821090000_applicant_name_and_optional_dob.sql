-- Date of birth is only meaningful for self-drive eligibility; chauffeur-driven
-- bookings no longer collect it, so it can't stay a hard not-null column.
alter table booking_applicants alter column date_of_birth drop not null;

-- The applicant's full legal name (as on their ID/passport) was missed in the
-- original KYC form design.
alter table booking_applicants add column full_name text;
