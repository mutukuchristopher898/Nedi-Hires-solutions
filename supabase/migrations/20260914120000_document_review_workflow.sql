-- Document review: a third outcome, a reason, an expiry, and a history.
--
-- The queue had approve and reject and nothing else, which forces a bad
-- choice: a blurry photo is not a rejected applicant, but rejecting was the
-- only way to say "this one is no good". "Returned" says what is actually
-- meant — we need a better copy — and is the state that lets the customer
-- upload again.

alter table public.identity_documents
  add column if not exists review_reason text,
  add column if not exists returned_at   timestamptz,
  -- Expiry is on the document, not the account: a licence and a passport
  -- expire on their own dates.
  add column if not exists expires_at    date;

-- 'returned' is distinct from 'rejected'. Rejected is a decision about the
-- document; returned is a request to the customer, and only returned should
-- reopen the upload on their side.
alter table public.identity_documents drop constraint if exists identity_documents_status_check;
alter table public.identity_documents
  add constraint identity_documents_status_check
  check (status in ('pending', 'approved', 'rejected', 'returned'));

create index if not exists identity_documents_expiry_idx
  on public.identity_documents (expires_at)
  where status = 'approved' and expires_at is not null;

-- ─────────────────────────────────────────────────────────────
-- The history
--
-- A separate table rather than overwriting review_reason, because the brief
-- asks for the thread of previous rejections to stay visible. Overwriting
-- would mean the third reviewer cannot see that the same document has been
-- returned twice already for the same fault.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.document_reviews (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.identity_documents (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  -- Denormalised for the same reason the audit log does it: a reviewer's
  -- profile may later be erased, and a review with no author is not a review.
  reviewer_email text,
  outcome     text not null check (outcome in ('approved', 'rejected', 'returned')),
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists document_reviews_document_idx
  on public.document_reviews (document_id, created_at desc);

alter table public.document_reviews enable row level security;

create policy "Staff can read document reviews" on public.document_reviews
  for select using (is_staff());

-- Customers see why their own document came back. Without this the "return
-- for review" outcome is useless to the person who has to act on it.
create policy "Customers can read reviews of their own documents" on public.document_reviews
  for select using (
    document_id in (select id from public.identity_documents where customer_id = auth.uid())
  );

create policy "Staff can record document reviews" on public.document_reviews
  for insert to authenticated with check (is_staff());

-- ─────────────────────────────────────────────────────────────
-- A reason is required for anything that is not an approval
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_document_review()
returns trigger
language plpgsql
security definer set search_path = public   -- reads profiles for the reviewer email
as $fn$
declare
  v_email text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- A customer re-submitting sets the status back to 'pending'. That is not a
  -- review: it has no reviewer, needs no reason, and 'pending' is not a valid
  -- outcome — recording it would fail the check constraint and block the
  -- resubmission entirely. Clear the previous reason and get out of the way.
  if new.status = 'pending' then
    new.review_reason := null;
    new.returned_at   := null;
    return new;
  end if;

  if new.status in ('rejected', 'returned')
     and coalesce(btrim(new.review_reason), '') = '' then
    raise exception 'Rejecting or returning a document needs a reason the customer can act on.'
      using errcode = '23514', hint = 'review_reason_required';
  end if;

  if new.status = 'returned' then
    new.returned_at := now();
  end if;

  if new.status = 'approved' then
    new.review_reason := null;
  end if;

  new.reviewed_at := now();
  new.reviewed_by := auth.uid();

  select email into v_email from profiles where id = auth.uid();

  insert into document_reviews (document_id, reviewer_id, reviewer_email, outcome, reason)
  values (new.id, auth.uid(), v_email, new.status, new.review_reason);

  return new;
end;
$fn$;

drop trigger if exists trg_enforce_document_review on public.identity_documents;
create trigger trg_enforce_document_review
  before update of status on public.identity_documents
  for each row execute function public.enforce_document_review();

-- ─────────────────────────────────────────────────────────────
-- A returned document can be replaced by its owner
--
-- Customers could insert an identity document but never update one, so a
-- returned document could not actually be re-submitted — the outcome existed
-- with no way to act on it. Narrowly scoped: only their own, only while it is
-- returned, and it goes straight back to pending rather than letting the
-- customer set any status they like.
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Customers can replace a returned document" on public.identity_documents;
create policy "Customers can replace a returned document" on public.identity_documents
  for update to authenticated
  using (customer_id = auth.uid() and status = 'returned')
  with check (customer_id = auth.uid() and status = 'pending');
