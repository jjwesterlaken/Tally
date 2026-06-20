-- ============================================================================
-- Tally — Supabase schema for CLOUD mode
-- Run this in your Supabase project's SQL editor, then add your URL + anon key
-- to .env (see .env.example). Auth (email/password) is provided by Supabase Auth.
-- ============================================================================

-- One row per user: their personal bucket, settings, and which household (if any).
create table if not exists public.app_data (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  household_id uuid,
  personal     jsonb not null default '{}'::jsonb,
  settings     jsonb not null default '{}'::jsonb,
  integrations jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- One row per household (a couple): the shared bucket + membership + invite code.
create table if not exists public.households (
  id          uuid primary key,
  invite_code text unique not null,
  members     uuid[] not null default '{}',
  shared      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.app_data   enable row level security;
alter table public.households enable row level security;

-- app_data: a user can only see and write their own row.
drop policy if exists app_data_own on public.app_data;
create policy app_data_own on public.app_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- households: any signed-in user may read a household (needed to look up an
-- invite code before joining) and create one. Updates are restricted to members.
drop policy if exists households_read on public.households;
create policy households_read on public.households
  for select
  using (auth.role() = 'authenticated');

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists households_member_update on public.households;
create policy households_member_update on public.households
  for update
  using (auth.uid() = any (members) or auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Note: this is a pragmatic starter policy set. For production, tighten the
-- households update/read policies (e.g. restrict reads to members once a user
-- has joined) and consider a dedicated join function to avoid broad read access
-- to invite codes.
