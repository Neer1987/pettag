-- Allow account deletion from the app (MVP anon policies)

drop policy if exists "owners_delete_anon" on owners;
create policy "owners_delete_anon" on owners for delete using (true);

drop policy if exists "messages_delete_anon" on messages;
create policy "messages_delete_anon" on messages for delete using (true);
