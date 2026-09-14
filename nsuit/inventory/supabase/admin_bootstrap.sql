-- =============================================================================
-- Create your single ADMIN login. Run AFTER schema.sql + rls.sql.
--
-- Step 1 (dashboard, not SQL): Supabase → Authentication → Users → "Add user".
--          Enter your admin email + a password. Tick "Auto Confirm User".
--          Copy the new user's UID.
--
-- Step 2 (here): paste that UID below and run this query.
-- =============================================================================
set search_path to inventory;

insert into profiles (id, role, full_name)
values ('PASTE_ADMIN_AUTH_UID_HERE', 'admin', 'Administrator')
on conflict (id) do update set role = 'admin';
