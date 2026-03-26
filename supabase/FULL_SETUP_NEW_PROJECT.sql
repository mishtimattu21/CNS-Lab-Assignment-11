-- =============================================================================
-- SecureChat — full database setup for a NEW Supabase project
-- Run once: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- =============================================================================
-- After this succeeds:
--   1. Authentication → Providers → Email → ON (confirm email optional for dev)
--   2. Project Settings → API → copy Project URL + anon key → .env (Vite)
--   3. Project Settings → API → copy service_role key → server/.env (never expose)
--   4. App: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
--   5. Server: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
-- =============================================================================

-- Tables, RLS, and signup trigger for profiles

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username) values (new.id, null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Groups (each has a shareable code)

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null default 'Group chat',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index groups_code_idx on public.groups (code);

alter table public.groups enable row level security;

create policy "groups_select_authenticated" on public.groups
  for select to authenticated using (true);

create policy "groups_insert_creator" on public.groups
  for insert to authenticated with check (auth.uid() = created_by);

-- Membership (required to read messages)

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

alter table public.group_members enable row level security;

create policy "group_members_select_own" on public.group_members
  for select to authenticated using (
    auth.uid() = user_id
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "group_members_insert_self" on public.group_members
  for insert to authenticated with check (auth.uid() = user_id);

-- Messages (inserts only via service role / your Node server; clients read if member)

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_group_created_idx on public.messages (group_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_members" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id and gm.user_id = auth.uid()
    )
  );

-- Delete group (creator only) and leave group (remove own membership)

create policy "groups_delete_creator" on public.groups
  for delete to authenticated
  using (auth.uid() = created_by);

create policy "group_members_delete_self" on public.group_members
  for delete to authenticated
  using (auth.uid() = user_id);

-- Done. No INSERT policy on messages for the anon/authenticated role — only the service role (Node) inserts.
