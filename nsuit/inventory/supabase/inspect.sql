-- =============================================================================
-- READ-ONLY inspection. Changes NOTHING. Run in Supabase SQL editor and paste
-- the results back. Lets us confirm the new app won't collide with anything.
-- =============================================================================

-- 1) All non-system schemas + how many tables each has
select n.nspname                         as schema,
       count(c.oid) filter (where c.relkind in ('r','p')) as tables
from pg_namespace n
left join pg_class c on c.relnamespace = n.oid
where n.nspname not in ('pg_catalog','information_schema','pg_toast')
  and n.nspname not like 'pg_temp%'
  and n.nspname not like 'pg_toast_temp%'
group by n.nspname
order by n.nspname;

-- 2) CRITICAL: does an "inventory" schema already exist? (must be empty result)
select nspname as existing_inventory_schema
from pg_namespace
where nspname = 'inventory';

-- 3) Every table in the public schema (so we can see your other project)
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
