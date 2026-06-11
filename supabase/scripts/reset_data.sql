-- PetTag data reset queries (run in Supabase SQL Editor)
-- Replace 'your@email.com' with the account you signed up with.
--
-- IMPORTANT: Supabase does NOT allow DELETE on storage.objects via SQL.
-- Pet photos must be removed via:
--   • App → Account → "Delete account & data"  (recommended — uses Storage API)
--   • Dashboard → Storage → pet-media → delete the owner folder
--   • node scripts/delete-account.cjs your@email.com

-- ─────────────────────────────────────────────────────────────
-- 1) Delete ONE account — database rows only
--    (run AFTER clearing storage, or orphaned files remain in bucket)
-- ─────────────────────────────────────────────────────────────

delete from messages
where recipient_email = 'your@email.com';

delete from otp_codes
where email = 'your@email.com';

delete from owners
where email = 'your@email.com';
-- pets for this owner are removed automatically (ON DELETE CASCADE)

-- ─────────────────────────────────────────────────────────────
-- 2) Preview storage files to delete manually in Dashboard
--    (SELECT is allowed; DELETE is not)
-- ─────────────────────────────────────────────────────────────

-- select name, created_at
-- from storage.objects
-- where bucket_id = 'pet-media'
--   and name like (
--     select id::text || '/%' from owners where email = 'your@email.com'
--   );

-- ─────────────────────────────────────────────────────────────
-- 3) Wipe ALL app database rows (dev reset — cannot be undone)
--    Clear Storage bucket separately in Dashboard → pet-media
-- ─────────────────────────────────────────────────────────────

-- delete from messages;
-- delete from otp_codes;
-- delete from pets;
-- delete from owners;

-- ─────────────────────────────────────────────────────────────
-- 4) Preview accounts before deleting
-- ─────────────────────────────────────────────────────────────

-- select email, full_name, id, created_at from owners order by created_at desc;
-- select p.name, p.qr_code_id, o.email from pets p join owners o on o.id = p.owner_id;
