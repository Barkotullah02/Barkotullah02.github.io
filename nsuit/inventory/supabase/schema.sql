-- =============================================================================
-- Inventory Beacon — Supabase schema
--
-- ISOLATION: everything lives in a dedicated "inventory" schema. This file
-- NEVER touches the "public" schema or any other project's tables. The only
-- destructive statement is "drop schema if exists inventory cascade", which
-- affects ONLY this app's own schema.
--
-- Run order:  schema.sql  ->  rls.sql  ->  seed.sql  ->  admin_bootstrap.sql
-- Run in the Supabase SQL editor (Database → SQL Editor → New query).
--
-- AFTER running this, expose the schema to the API:
--   Supabase → Settings → API → "Exposed schemas" → add  inventory  → Save.
-- =============================================================================

drop schema if exists inventory cascade;
create schema inventory;
set search_path to inventory;   -- note: public is intentionally NOT in the path

-- =============================================================================
-- profiles: links a Supabase Auth user to a role (admin | employee)
-- =============================================================================
create table profiles (
    id          uuid primary key references auth.users (id) on delete cascade,
    role        text not null default 'employee' check (role in ('admin', 'employee')),
    full_name   text,
    employee_id bigint,
    created_at  timestamptz not null default now()
);

-- =============================================================================
-- employees: PROFILE record for every person (whether or not they log in)
-- =============================================================================
create table employees (
    id            bigint generated always as identity primary key,
    full_name     text not null,
    employee_code text unique,
    department    text,
    designation   text,
    email         text unique,
    phone         text,
    status        text not null default 'active' check (status in ('active', 'inactive')),
    auth_user_id  uuid unique references auth.users (id) on delete set null,
    remarks       text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

alter table profiles
    add constraint profiles_employee_fk
    foreign key (employee_id) references employees (id) on delete set null;

-- =============================================================================
-- categories
-- =============================================================================
create table categories (
    id   bigint generated always as identity primary key,
    name text not null unique
);

-- =============================================================================
-- products (current_stock & status derived in the view, never stored)
-- =============================================================================
create table products (
    id                  bigint generated always as identity primary key,
    name                text not null,
    category_id         bigint references categories (id) on delete set null,
    opening_stock       integer not null default 0,
    low_stock_threshold integer not null default 5,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);
create index on products (category_id);

-- =============================================================================
-- stock_movements: every IN / OUT event
-- =============================================================================
create table stock_movements (
    id         bigint generated always as identity primary key,
    product_id bigint not null references products (id) on delete cascade,
    type       text not null check (type in ('IN', 'OUT')),
    quantity   integer not null check (quantity > 0),
    moved_on   date not null default current_date,
    remarks    text,
    actor_name text not null default 'admin',
    created_at timestamptz not null default now()
);
create index on stock_movements (product_id);

-- =============================================================================
-- assignments
-- =============================================================================
create table assignments (
    id                 bigint generated always as identity primary key,
    asset_tag          text,
    product_id         bigint not null references products (id) on delete restrict,
    employee_id        bigint not null references employees (id) on delete restrict,
    brand              text,
    specification      text,
    quantity           integer not null default 1 check (quantity > 0),
    date_issued        date not null default current_date,
    expected_return    date,
    condition_at_issue text,
    issued_by          text,
    status             text not null default 'ISSUED' check (status in ('ISSUED', 'RETURNED')),
    returned_on        date,
    remarks            text,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);
create index on assignments (employee_id);
create index on assignments (product_id);
create index on assignments (status);

-- =============================================================================
-- activity_log
-- =============================================================================
create table activity_log (
    id          bigint generated always as identity primary key,
    action      text not null,
    entity_type text not null,
    entity_id   bigint,
    message     text not null,
    metadata    jsonb,
    actor_name  text not null default 'admin',
    created_at  timestamptz not null default now()
);
create index on activity_log (created_at desc);

-- =============================================================================
-- product_stock view: current stock + derived status
-- =============================================================================
create view product_stock as
select
    p.id,
    p.name,
    p.category_id,
    c.name as category_name,
    p.opening_stock,
    p.low_stock_threshold,
    coalesce(sum(m.quantity) filter (where m.type = 'IN'),  0) as total_stock_in,
    coalesce(sum(m.quantity) filter (where m.type = 'OUT'), 0) as total_stock_out,
    p.opening_stock
        + coalesce(sum(m.quantity) filter (where m.type = 'IN'),  0)
        - coalesce(sum(m.quantity) filter (where m.type = 'OUT'), 0) as current_stock,
    case
        when p.opening_stock
             + coalesce(sum(m.quantity) filter (where m.type = 'IN'),  0)
             - coalesce(sum(m.quantity) filter (where m.type = 'OUT'), 0)
             <= p.low_stock_threshold
        then 'LOW STOCK' else 'OK'
    end as status
from products p
left join categories c      on c.id = p.category_id
left join stock_movements m on m.product_id = p.id
group by p.id, c.name;

alter view product_stock set (security_invoker = on);

-- =============================================================================
-- Triggers: keep assignments and stock in sync
-- =============================================================================
create or replace function assignment_stock_sync() returns trigger
    language plpgsql
    set search_path = inventory, pg_temp
as $$
begin
    if (tg_op = 'INSERT') then
        if new.status = 'ISSUED' then
            insert into stock_movements (product_id, type, quantity, moved_on, remarks, actor_name)
            values (new.product_id, 'OUT', new.quantity, new.date_issued,
                    'Issued (assignment #' || new.id || ')', coalesce(new.issued_by, 'admin'));
        end if;
    elsif (tg_op = 'UPDATE') then
        if old.status = 'ISSUED' and new.status = 'RETURNED' then
            insert into stock_movements (product_id, type, quantity, moved_on, remarks, actor_name)
            values (new.product_id, 'IN', new.quantity, coalesce(new.returned_on, current_date),
                    'Returned (assignment #' || new.id || ')', 'admin');
        end if;
    end if;
    return new;
end;
$$;

create trigger trg_assignment_stock_sync
    after insert or update on assignments
    for each row execute function assignment_stock_sync();

-- Guard: never let an OUT movement push a product's stock below zero. This
-- enforces the invariant in the DB for EVERY path (direct stock-out, the
-- assignment trigger, or any API call), not just in the browser.
create or replace function stock_movement_guard() returns trigger
    language plpgsql set search_path = inventory, pg_temp
as $$
declare available integer;
begin
    if new.type = 'OUT' then
        select p.opening_stock
             + coalesce(sum(m.quantity) filter (where m.type = 'IN'),  0)
             - coalesce(sum(m.quantity) filter (where m.type = 'OUT'), 0)
        into available
        from products p
        left join stock_movements m on m.product_id = p.id
        where p.id = new.product_id
        group by p.id;

        available := coalesce(available, 0);
        if new.quantity > available then
            raise exception 'Not enough stock: only % available', available
                using errcode = 'check_violation';
        end if;
    end if;
    return new;
end;
$$;

create trigger trg_stock_movement_guard
    before insert on stock_movements
    for each row execute function stock_movement_guard();

create or replace function touch_updated_at() returns trigger
    language plpgsql set search_path = inventory, pg_temp
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_products_touch    before update on products    for each row execute function touch_updated_at();
create trigger trg_employees_touch   before update on employees   for each row execute function touch_updated_at();
create trigger trg_assignments_touch before update on assignments for each row execute function touch_updated_at();

-- =============================================================================
-- Grants: let the Supabase API roles reach THIS schema (RLS still governs rows)
-- =============================================================================
grant usage on schema inventory to anon, authenticated;
grant select, insert, update, delete on all tables in schema inventory to authenticated;
grant select on all tables in schema inventory to anon;
grant usage, select on all sequences in schema inventory to authenticated;
