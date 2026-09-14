-- ─────────────────────────────────────────────────────────────
-- Suspension covers the rest of the writes
--
-- 20260913210000 stopped a suspended account from creating bookings, sending
-- contact messages and submitting vehicles. It left five other ways in, and
-- the two that matter most are file uploads: a suspended account could still
-- push objects into the kyc-documents and vehicle-photos buckets, which is
-- storage you pay for and content you are responsible for hosting. It could
-- also register a business, raise quote requests and start a subscription.
--
-- Each policy below is its predecessor with `not is_suspended()` added and
-- nothing else changed.
--
-- Two writes are deliberately left alone:
--
--   * bookings UPDATE and booking_applicants UPDATE. A booking cannot be
--     created while suspended, so these only ever apply to one placed before
--     the suspension — and blocking them would strand someone mid-wizard
--     having already paid a deposit. What they can change is already bounded:
--     enforce_booking_money() refuses to reprice and the status trigger only
--     allows single forward steps.
--
--   * Reads, everywhere. Someone suspended should still be able to see the
--     hire they already have.
--
-- is_suspended() is `stable` and already granted to authenticated, so it adds
-- one indexed lookup per statement, not per row.
-- ─────────────────────────────────────────────────────────────

-- ── Registering a business ──────────────────────────────────
-- The original had no explicit role, so it applied to public. Narrowed to
-- authenticated at the same time: owner_profile_id = auth.uid() was already
-- unsatisfiable for anon, so this removes nothing that worked.
drop policy if exists "Partners can be created by their owner" on public.partners;
create policy "Partners can be created by their owner" on public.partners
  for insert to authenticated
  with check (auth.uid() = owner_profile_id and not is_suspended());

-- ── Identity documents ──────────────────────────────────────
-- Blocked rather than allowed-to-finish, unlike the booking updates above,
-- because this one carries a file into storage. A suspended customer who
-- genuinely needs to complete KYC is a case for lifting the suspension or
-- cancelling the booking, which an operator has to do anyway:
-- anonymise_account() already refuses while a hire is live.
drop policy if exists "Customers can submit their own documents" on public.identity_documents;
create policy "Customers can submit their own documents" on public.identity_documents
  for insert to authenticated
  with check (auth.uid() = customer_id and not is_suspended());

drop policy if exists "Customers can replace a returned document" on public.identity_documents;
create policy "Customers can replace a returned document" on public.identity_documents
  for update to authenticated
  using (customer_id = auth.uid() and status = 'returned' and not is_suspended())
  with check (customer_id = auth.uid() and status = 'pending');

-- ── Quote requests ──────────────────────────────────────────
drop policy if exists "Requesters can create their own quote requests" on public.quote_requests;
create policy "Requesters can create their own quote requests" on public.quote_requests
  for insert to authenticated
  with check (auth.uid() = requester_profile_id and not is_suspended());

-- ── Subscriptions ───────────────────────────────────────────
drop policy if exists "Customers can create their own subscription" on public.subscriptions;
create policy "Customers can create their own subscription" on public.subscriptions
  for insert to authenticated
  with check (auth.uid() = customer_id and not is_suspended());

-- ── Storage: the two buckets an ordinary account can write to ──
drop policy if exists "kyc_documents_owner_insert" on storage.objects;
create policy "kyc_documents_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_suspended()
  );

drop policy if exists "vehicle_photos_owner_insert" on storage.objects;
create policy "vehicle_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_suspended()
  );
