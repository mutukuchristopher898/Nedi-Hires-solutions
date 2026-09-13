-- Editable option lists, so adding a pickup location or a rejection reason
-- stops being a code change and a deploy.
--
-- One table rather than one per list. The lists are all the same shape — an
-- ordered set of short strings that can be retired — and five near-identical
-- tables with five near-identical policy sets is worse than one with a
-- discriminator.
--
-- Vehicle classification is deliberately NOT here. It is a CHECK constraint on
-- vehicles.classification and appears in the search URL, so making it editable
-- means dropping the constraint and deciding what happens to listings whose
-- class is removed. That is its own piece of work, not a footnote to this one.

create table if not exists public.admin_options (
  list        text not null check (list in (
                'pickup_location',
                'vehicle_feature',
                'vehicle_rejection_reason',
                'document_rejection_reason',
                'document_type'
              )),
  value       text not null,
  sort_order  int  not null default 0,
  -- Retired rather than deleted: an option that has been used by existing
  -- records should stop being offered without rewriting history.
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  primary key (list, value)
);

create index if not exists admin_options_list_idx
  on public.admin_options (list, active, sort_order);

alter table public.admin_options enable row level security;

-- Readable by everyone: these populate the partner onboarding form and the
-- public booking flow, and most of those visitors are not signed in. Nothing
-- here is private — they are dropdown contents.
drop policy if exists "Option lists are publicly readable" on public.admin_options;
create policy "Option lists are publicly readable" on public.admin_options
  for select to anon, authenticated using (true);

drop policy if exists "Admins manage option lists" on public.admin_options;
create policy "Admins manage option lists" on public.admin_options
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- Seeded with exactly what is hardcoded today, so nothing changes until
-- somebody edits a list.
insert into public.admin_options (list, value, sort_order) values
  ('pickup_location', 'Nairobi CBD', 1),
  ('pickup_location', 'Jomo Kenyatta International Airport (JKIA)', 2),
  ('pickup_location', 'Mombasa Moi International Airport', 3),
  ('pickup_location', 'Kisumu', 4),

  ('vehicle_feature', 'Bluetooth', 1),
  ('vehicle_feature', 'USB Charging', 2),
  ('vehicle_feature', 'Reverse Camera', 3),
  ('vehicle_feature', 'Air Conditioning', 4),
  ('vehicle_feature', 'Fuel Efficient', 5),
  ('vehicle_feature', 'Spacious Boot', 6),
  ('vehicle_feature', 'GPS Navigation', 7),
  ('vehicle_feature', 'Child Seat Available', 8),

  ('vehicle_rejection_reason', 'Photos are unclear or don''t show the vehicle', 1),
  ('vehicle_rejection_reason', 'Registration number doesn''t match the documents', 2),
  ('vehicle_rejection_reason', 'Price is outside what we can list', 3),
  ('vehicle_rejection_reason', 'Vehicle doesn''t meet our condition standard', 4),
  ('vehicle_rejection_reason', 'Missing or expired documentation', 5),

  ('document_rejection_reason', 'Image is blurry or unreadable', 1),
  ('document_rejection_reason', 'Document has expired', 2),
  ('document_rejection_reason', 'Wrong document type submitted', 3),
  ('document_rejection_reason', 'Name does not match the booking', 4),
  ('document_rejection_reason', 'Other', 5),

  ('document_type', 'International Passport', 1),
  ('document_type', 'Driver''s License', 2),
  ('document_type', 'National ID', 3)
on conflict (list, value) do nothing;
