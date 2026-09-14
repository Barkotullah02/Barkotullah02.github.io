-- =============================================================================
-- Inventory Beacon — Row-Level Security (all objects in the "inventory" schema)
-- Run AFTER schema.sql.
--
-- Model: one admin, many employees.
--   * admin    -> full access
--   * employee -> read ONLY their own profile + own assignments + catalog
-- =============================================================================

set search_path to inventory;

-- Helper: is the current auth user an admin? --------------------------------
create or replace function is_admin() returns boolean
    language sql stable security definer set search_path = inventory, pg_temp
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Helper: the employees.id that belongs to the current auth user -----------
create or replace function my_employee_id() returns bigint
    language sql stable security definer set search_path = inventory, pg_temp
as $$
  select id from employees where auth_user_id = auth.uid() limit 1;
$$;

-- Enable RLS -----------------------------------------------------------------
alter table profiles        enable row level security;
alter table employees       enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table stock_movements enable row level security;
alter table assignments     enable row level security;
alter table activity_log    enable row level security;

-- profiles -------------------------------------------------------------------
create policy profiles_self_read on profiles
    for select using (id = auth.uid() or is_admin());
create policy profiles_admin_write on profiles
    for all using (is_admin()) with check (is_admin());

-- employees ------------------------------------------------------------------
create policy employees_read on employees
    for select using (is_admin() or auth_user_id = auth.uid());
create policy employees_admin_write on employees
    for all using (is_admin()) with check (is_admin());

-- categories -----------------------------------------------------------------
create policy categories_read on categories
    for select using (auth.role() = 'authenticated');
create policy categories_admin_write on categories
    for all using (is_admin()) with check (is_admin());

-- products -------------------------------------------------------------------
create policy products_read on products
    for select using (auth.role() = 'authenticated');
create policy products_admin_write on products
    for all using (is_admin()) with check (is_admin());

-- stock_movements (admin only) ----------------------------------------------
create policy movements_admin_all on stock_movements
    for all using (is_admin()) with check (is_admin());

-- assignments ----------------------------------------------------------------
create policy assignments_read on assignments
    for select using (is_admin() or employee_id = my_employee_id());
create policy assignments_admin_write on assignments
    for all using (is_admin()) with check (is_admin());

-- activity_log (admin only) --------------------------------------------------
create policy activity_admin_all on activity_log
    for all using (is_admin()) with check (is_admin());
