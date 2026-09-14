-- =============================================================================
-- Migration 01 — negative-stock guard for an EXISTING database.
-- Run this once if you already ran the original schema.sql (before the guard
-- was added). Safe to re-run. It only adds a BEFORE INSERT trigger; it changes
-- no data and touches only the inventory schema.
-- =============================================================================
set search_path to inventory;

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

drop trigger if exists trg_stock_movement_guard on stock_movements;
create trigger trg_stock_movement_guard
    before insert on stock_movements
    for each row execute function stock_movement_guard();
