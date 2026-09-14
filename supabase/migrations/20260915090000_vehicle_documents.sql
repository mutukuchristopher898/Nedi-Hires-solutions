-- ─────────────────────────────────────────────────────────────
-- Vehicle documents
--
-- A partner could list a vehicle with nothing but photographs. Nothing in the
-- system asked who owns the car or whether it is insured, which makes
-- "approved" a statement about the photographs and not much else.
--
-- Shaped deliberately like identity_documents and its review workflow: same
-- four states, same reason-on-refusal rule, same private bucket and signed
-- URLs, same expiry warnings. An operator who has learned the ID queue should
-- not have to learn a second set of ideas.
--
-- Two differences that matter:
--
--   * Expiry is the point here, not a detail. An ID expiring is an
--     inconvenience; an insurance certificate expiring means an uninsured
--     vehicle out on hire. Both the dashboard and the vehicle screen warn on
--     it.
--
--   * Approval is NOT blocked on documents. It would be the stronger rule,
--     and it is deliberately not taken: there are already hundreds of pending
--     vehicles predating this table, and a hard block would make every one of
--     them unapprovable with no way to fix it except uploading paperwork that
--     does not exist. The screens warn loudly instead. Turning this into a
--     hard requirement is a one-line trigger change once real partners are
--     actually uploading.
-- ─────────────────────────────────────────────────────────────

-- ── 1. New option lists ─────────────────────────────────────
-- Widening an existing CHECK, so every current row already satisfies it and
-- the rewrite is safe without `not valid`.
alter table public.admin_options drop constraint if exists admin_options_list_check;
alter table public.admin_options add constraint admin_options_list_check check (list in (
  'pickup_location',
  'vehicle_feature',
  'vehicle_rejection_reason',
  'document_rejection_reason',
  'document_type',
  'vehicle_document_type',
  'vehicle_document_rejection_reason'
));

insert into public.admin_options (list, value, sort_order) values
  ('vehicle_document_type', 'Logbook', 1),
  ('vehicle_document_type', 'Insurance Certificate', 2),
  ('vehicle_document_type', 'Inspection Certificate', 3),
  ('vehicle_document_type', 'PSV Licence', 4),

  ('vehicle_document_rejection_reason', 'Document is unreadable — please upload a clearer scan', 1),
  ('vehicle_document_rejection_reason', 'Expired — please upload a current certificate', 2),
  ('vehicle_document_rejection_reason', 'Registration does not match the vehicle listed', 3),
  ('vehicle_document_rejection_reason', 'Name on the document does not match the partner account', 4),
  ('vehicle_document_rejection_reason', 'Wrong document type for this slot', 5),
  ('vehicle_document_rejection_reason', 'Pages are missing', 6)
on conflict (list, value) do nothing;

-- ── 2. The table ────────────────────────────────────────────
create table if not exists public.vehicle_documents (
  id           uuid primary key default gen_random_uuid(),

  -- Cascades, so delete_vehicle() keeps working. The files it points at are
  -- removed by the caller, which is the same split identity_documents uses:
  -- SQL cannot reach the storage API.
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,

  -- Not a CHECK: the types live in admin_options so they can be edited
  -- without a migration, and a constraint here would silently diverge from
  -- that list the first time someone adds one.
  doc_type     text not null,

  file_path    text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected', 'returned')),

  -- The whole reason this table exists. Null for a logbook, which does not
  -- expire; required in practice for insurance and inspection.
  expires_at   date,

  review_reason text,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  returned_at  timestamptz,

  uploaded_by  uuid not null references public.profiles (id),
  submitted_at timestamptz not null default now()
);

create index if not exists vehicle_documents_vehicle_idx
  on public.vehicle_documents (vehicle_id, status);

-- Drives the expiring-soon warnings, which scan by date across every vehicle.
create index if not exists vehicle_documents_expiry_idx
  on public.vehicle_documents (expires_at)
  where status = 'approved' and expires_at is not null;

alter table public.vehicle_documents enable row level security;

-- ── 3. Who can see and do what ──────────────────────────────

-- A partner sees the documents for their own vehicles, and nobody else's.
-- Written as a join through vehicles rather than storing partner_id here,
-- so a vehicle moved between partners takes its paperwork with it.
drop policy if exists "Partners view their own vehicle documents" on public.vehicle_documents;
create policy "Partners view their own vehicle documents" on public.vehicle_documents
  for select to authenticated
  using (
    vehicle_id in (
      select v.id from public.vehicles v
      join public.partners p on p.id = v.partner_id
      where p.owner_profile_id = auth.uid()
    )
  );

drop policy if exists "Partners upload their own vehicle documents" on public.vehicle_documents;
create policy "Partners upload their own vehicle documents" on public.vehicle_documents
  for insert to authenticated
  with check (
    not is_suspended()
    and uploaded_by = auth.uid()
    and status = 'pending'
    and vehicle_id in (
      select v.id from public.vehicles v
      join public.partners p on p.id = v.partner_id
      where p.owner_profile_id = auth.uid()
    )
  );

-- Replacing a returned document, mirroring the identity_documents rule: only
-- from 'returned', only back to 'pending'. A partner cannot approve their own
-- paperwork because 'approved' is not a permitted destination.
drop policy if exists "Partners replace a returned vehicle document" on public.vehicle_documents;
create policy "Partners replace a returned vehicle document" on public.vehicle_documents
  for update to authenticated
  using (
    not is_suspended()
    and status = 'returned'
    and vehicle_id in (
      select v.id from public.vehicles v
      join public.partners p on p.id = v.partner_id
      where p.owner_profile_id = auth.uid()
    )
  )
  with check (status = 'pending');

-- A partner can withdraw a document they uploaded by mistake, but only while
-- nobody has ruled on it. Once reviewed it is part of the record.
drop policy if exists "Partners delete an unreviewed vehicle document" on public.vehicle_documents;
create policy "Partners delete an unreviewed vehicle document" on public.vehicle_documents
  for delete to authenticated
  using (
    status = 'pending'
    and reviewed_at is null
    and vehicle_id in (
      select v.id from public.vehicles v
      join public.partners p on p.id = v.partner_id
      where p.owner_profile_id = auth.uid()
    )
  );

drop policy if exists "Staff view all vehicle documents" on public.vehicle_documents;
create policy "Staff view all vehicle documents" on public.vehicle_documents
  for select to authenticated using (is_staff());

drop policy if exists "Staff review vehicle documents" on public.vehicle_documents;
create policy "Staff review vehicle documents" on public.vehicle_documents
  for update to authenticated using (is_staff()) with check (is_staff());

-- ── 4. Review bookkeeping ───────────────────────────────────
-- The reviewer and the timestamp are stamped by the database rather than sent
-- by the client, for the same reason they are on identity_documents: a column
-- recording who decided something is worthless if the person deciding can
-- write it themselves.
create or replace function public.stamp_vehicle_document_review()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- A partner re-submitting sets 'pending', which is not a review. Stamping it
  -- would credit the partner with a decision they did not make.
  if new.status = 'pending' then
    new.reviewed_by  := null;
    new.reviewed_at  := null;
    new.review_reason := null;
    new.returned_at  := null;
    new.submitted_at := now();
    return new;
  end if;

  new.reviewed_by := auth.uid();
  new.reviewed_at := now();

  if new.status = 'returned' then
    new.returned_at := now();
  end if;

  -- Refusing without saying why leaves the partner with nothing to act on,
  -- which is how a listing sits in limbo for a fortnight.
  if new.status in ('rejected', 'returned')
     and coalesce(btrim(new.review_reason), '') = '' then
    raise exception 'A reason is required when rejecting or returning a document'
      using errcode = '23514';
  end if;

  return new;
end;
$fn$;

drop trigger if exists trg_stamp_vehicle_document_review on public.vehicle_documents;
create trigger trg_stamp_vehicle_document_review
  before update on public.vehicle_documents
  for each row execute function public.stamp_vehicle_document_review();

-- ── 5. Audit ────────────────────────────────────────────────
drop trigger if exists trg_audit_vehicle_documents on public.vehicle_documents;
create trigger trg_audit_vehicle_documents
  after insert or update or delete on public.vehicle_documents
  for each row execute function public.record_admin_change();

-- ── 6. The bucket ───────────────────────────────────────────
-- Private. A logbook is proof of ownership and an insurance certificate
-- carries a policy number; neither belongs behind a guessable public URL the
-- way a listing photograph does.
insert into storage.buckets (id, name, public)
values ('vehicle-documents', 'vehicle-documents', false)
on conflict (id) do nothing;

drop policy if exists "vehicle_documents_owner_insert" on storage.objects;
create policy "vehicle_documents_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vehicle-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_suspended()
  );

drop policy if exists "vehicle_documents_owner_select" on storage.objects;
create policy "vehicle_documents_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vehicle-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

drop policy if exists "vehicle_documents_owner_delete" on storage.objects;
create policy "vehicle_documents_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vehicle-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );
