-- Booking reference entropy, KYC upload limits, and a delete path for stored
-- documents. Audit findings F23, F26, F27.
--
-- Additive throughout: existing booking references keep working, existing
-- objects are untouched.

-- ─────────────────────────────────────────────────────────────
-- F27 — booking_ref collisions
--
-- The original default was
--     'BK-' || floor(random() * 89999 + 10000)::text
-- which draws from 90,000 values on a column with a unique constraint and no
-- retry. By the birthday bound the chance that some customer has already hit a
-- duplicate-key error is ~39% at 300 bookings and ~75% at 500 — and the
-- failure surfaces as a booking insert blowing up in the customer's face, not
-- as a retry.
--
-- Replaced with 8 characters drawn from a 31-glyph alphabet (~8.5e11 values)
-- plus a re-draw on collision.
-- ─────────────────────────────────────────────────────────────

create or replace function public.generate_booking_ref()
returns text
language plpgsql
volatile
security definer set search_path = public   -- must see every row: the uniqueness
                                            -- check is meaningless under RLS,
                                            -- which would hide other customers'
                                            -- references from the caller
as $fn$
declare
  -- 0/O and 1/I/L are left out. This reference gets read down a phone line and
  -- written on paper, so glyphs that are heard or seen alike cost real support
  -- time.
  v_alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_len      constant int  := length(v_alphabet);
  v_candidate text;
  v_attempt   int := 0;
begin
  loop
    v_candidate := 'BK-';
    for i in 1..4 loop
      v_candidate := v_candidate || substr(v_alphabet, 1 + floor(random() * v_len)::int, 1);
    end loop;
    v_candidate := v_candidate || '-';
    for i in 1..4 loop
      v_candidate := v_candidate || substr(v_alphabet, 1 + floor(random() * v_len)::int, 1);
    end loop;

    exit when not exists (select 1 from public.bookings where booking_ref = v_candidate);

    v_attempt := v_attempt + 1;
    if v_attempt >= 10 then
      -- Unreachable at any plausible volume: ten consecutive collisions in a
      -- space of 8.5e11 does not happen. Raising beats looping forever if the
      -- assumption is ever wrong.
      raise exception 'could not generate a unique booking reference after % attempts', v_attempt;
    end if;
  end loop;

  return v_candidate;
end;
$fn$;

create or replace function public.set_booking_ref()
returns trigger
language plpgsql
set search_path = public   -- no security definer needed: generate_booking_ref()
                           -- elevates on its own, and nothing else here reads
                           -- an RLS-protected table
as $fn$
begin
  -- Always overwrite. The reference is ours to mint, so a client-supplied one
  -- is discarded rather than trusted — matching how enforce_booking_money
  -- treats client-supplied pricing.
  new.booking_ref := public.generate_booking_ref();
  return new;
end;
$fn$;

-- The column default has to go, or it wins before the trigger ever runs.
alter table public.bookings alter column booking_ref drop default;

drop trigger if exists trg_set_booking_ref on public.bookings;
create trigger trg_set_booking_ref
  before insert on public.bookings
  for each row execute function public.set_booking_ref();

-- Existing references are left exactly as they are: they are printed on
-- agreements and quoted in support threads. Only new bookings get the new
-- shape, and the unique constraint still spans both.

-- ─────────────────────────────────────────────────────────────
-- F26 — KYC upload limits, enforced by the server
--
-- The browser checks file.type against an allow-list, but file.type is
-- attacker-controlled and the check is client-side, so it is a usability
-- guard rather than a security one. The bucket was created with neither a
-- size cap nor a MIME allow-list, leaving the project-wide default as the
-- only limit.
-- ─────────────────────────────────────────────────────────────

update storage.buckets
set file_size_limit   = 10485760,  -- 10 MB; these are phone photos and PDFs
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'kyc-documents';

-- ─────────────────────────────────────────────────────────────
-- F23 — no delete policy on kyc-documents
--
-- storage.objects has RLS on with insert/select policies only, so nothing
-- could ever be deleted from this bucket — including by an administrator
-- servicing an erasure request under the Data Protection Act 2019, and
-- including superseded re-uploads, which accumulated forever.
--
-- Deliberately admin-only. Giving customers delete on their own folder would
-- let an applicant remove an identity document after submitting it — during
-- review, or after a dispute — which is exactly the evidence the verification
-- trail depends on. Erasure stays available, but it runs through an operator
-- who can weigh it against the retention the booking record needs.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "kyc_documents_admin_delete" on storage.objects;
create policy "kyc_documents_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'kyc-documents' and is_admin());
