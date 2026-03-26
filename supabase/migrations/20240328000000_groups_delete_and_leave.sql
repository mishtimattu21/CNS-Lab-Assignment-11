-- Creator can delete a group (cascades to members + messages).
create policy "groups_delete_creator" on public.groups
  for delete to authenticated
  using (auth.uid() = created_by);

-- Any member can remove their own membership (leave group).
create policy "group_members_delete_self" on public.group_members
  for delete to authenticated
  using (auth.uid() = user_id);
