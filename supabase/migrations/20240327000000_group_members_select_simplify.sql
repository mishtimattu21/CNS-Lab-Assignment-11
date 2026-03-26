-- Optional: if "Joined groups" stays empty despite being a member, run this in SQL Editor.
-- Simplifies SELECT so each user only reads their own membership rows (enough for the dashboard).

drop policy if exists "group_members_select_own" on public.group_members;

create policy "group_members_select_own" on public.group_members
  for select to authenticated
  using (auth.uid() = user_id);
