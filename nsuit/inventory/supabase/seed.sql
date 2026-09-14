-- Auto-generated from Advanced_Stock_Inventory_System.xlsx. Run AFTER schema.sql & rls.sql.
begin;
set search_path to inventory;

-- Categories -----------------------------------------------------------------
insert into categories (name) values
  ('Drives & Storage'),
  ('Converters & Cables'),
  ('Battery & Charger'),
  ('Accessories');

-- Products -------------------------------------------------------------------
insert into products (name, category_id, opening_stock, low_stock_threshold) values
  ('M.2 Hard Drive (1TB)', (select id from categories where name='Drives & Storage'), 3, 5),
  ('M.2 Enclosure', (select id from categories where name='Drives & Storage'), 3, 5),
  ('SSD Enclosure', (select id from categories where name='Drives & Storage'), 16, 5),
  ('Pendrive 32 GB', (select id from categories where name='Drives & Storage'), 15, 5),
  ('Pendrive 64 GB', (select id from categories where name='Drives & Storage'), 15, 5),
  ('Pendrive 128 GB', (select id from categories where name='Drives & Storage'), 10, 5),
  ('USB Super Drive', (select id from categories where name='Drives & Storage'), 2, 5),
  ('Basus Switcher (1:2)', (select id from categories where name='Converters & Cables'), 0, 5),
  ('Ugreen Switcher (1:2)', (select id from categories where name='Converters & Cables'), 0, 5),
  ('D-Tech Switcher (1:8)', (select id from categories where name='Converters & Cables'), 3, 5),
  ('D-Tech Switcher (2:2)', (select id from categories where name='Converters & Cables'), 2, 5),
  ('D-Tech Switcher (1:2)', (select id from categories where name='Converters & Cables'), 6, 5),
  ('HDMI to VGA Converter', (select id from categories where name='Converters & Cables'), 56, 5),
  ('Display to HDMI Converter', (select id from categories where name='Converters & Cables'), 21, 5),
  ('Display to VGA Converter', (select id from categories where name='Converters & Cables'), 25, 5),
  ('Mini Display to VGA Converter', (select id from categories where name='Converters & Cables'), 7, 5),
  ('Type C to VGA, HDMI, Display, DVI Converter', (select id from categories where name='Converters & Cables'), 4, 5),
  ('USB HUB (Type-C)', (select id from categories where name='Converters & Cables'), 15, 5),
  ('USB HUB (Type-A)', (select id from categories where name='Converters & Cables'), 24, 5),
  ('Wireless Dongle (Wi-Fi)', (select id from categories where name='Converters & Cables'), 42, 5),
  ('Microphone Extension Cable', (select id from categories where name='Converters & Cables'), 22, 5),
  ('USB Extension Cable', (select id from categories where name='Converters & Cables'), 21, 5),
  ('Lightning to Headphone Jack', (select id from categories where name='Converters & Cables'), 12, 5),
  ('VGA to HDMI Converter', (select id from categories where name='Converters & Cables'), 12, 5),
  ('USB to Ethernet Adapter', (select id from categories where name='Converters & Cables'), 10, 5),
  ('Mini Gender Changer (Y cable)', (select id from categories where name='Converters & Cables'), 9, 5),
  ('Battery (AAA)', (select id from categories where name='Battery & Charger'), 216, 5),
  ('Battery (AA)', (select id from categories where name='Battery & Charger'), 30, 5),
  ('Battery (23A)', (select id from categories where name='Battery & Charger'), 40, 5),
  ('Charging Adapter (Samsung)', (select id from categories where name='Battery & Charger'), 6, 5),
  ('Doublepower Battery Charging Adapter', (select id from categories where name='Battery & Charger'), 10, 5),
  ('Sony Rechargeable Battery (AA)', (select id from categories where name='Battery & Charger'), 60, 5),
  ('Stapler Pin (small)', (select id from categories where name='Accessories'), 4, 5),
  ('Stapler Pin (big)', (select id from categories where name='Accessories'), 5, 5),
  ('Microphone', (select id from categories where name='Accessories'), 173, 5),
  ('Camera', (select id from categories where name='Accessories'), 146, 5),
  ('Tripod', (select id from categories where name='Accessories'), 140, 5),
  ('Tag Printer Cartridge', (select id from categories where name='Accessories'), 11, 5);

-- Stock movements (reproduce the workbook's Total In / Total Out) -------------
insert into stock_movements (product_id, type, quantity, remarks) values
  ((select id from products where name='M.2 Hard Drive (1TB)'), 'OUT', 2, 'Opening — imported from workbook'),
  ((select id from products where name='M.2 Enclosure'), 'OUT', 2, 'Opening — imported from workbook'),
  ((select id from products where name='Pendrive 32 GB'), 'OUT', 1, 'Opening — imported from workbook'),
  ((select id from products where name='Pendrive 64 GB'), 'OUT', 10, 'Opening — imported from workbook'),
  ((select id from products where name='Pendrive 128 GB'), 'OUT', 8, 'Opening — imported from workbook'),
  ((select id from products where name='Basus Switcher (1:2)'), 'IN',  17, 'Opening — imported from workbook'),
  ((select id from products where name='Basus Switcher (1:2)'), 'OUT', 2, 'Opening — imported from workbook'),
  ((select id from products where name='Ugreen Switcher (1:2)'), 'IN',  7, 'Opening — imported from workbook'),
  ((select id from products where name='D-Tech Switcher (1:8)'), 'OUT', 2, 'Opening — imported from workbook'),
  ((select id from products where name='D-Tech Switcher (1:2)'), 'OUT', 3, 'Opening — imported from workbook'),
  ((select id from products where name='Wireless Dongle (Wi-Fi)'), 'IN',  4, 'Opening — imported from workbook'),
  ((select id from products where name='Doublepower Battery Charging Adapter'), 'OUT', 2, 'Opening — imported from workbook'),
  ((select id from products where name='Tripod'), 'IN',  17, 'Opening — imported from workbook'),
  ((select id from products where name='Tripod'), 'OUT', 2, 'Opening — imported from workbook');

-- Employees (profiles) -------------------------------------------------------
insert into employees (full_name) values
  ('Abdullah Al Mahmud Pias'),
  ('Abdullah Almoon'),
  ('Fardin Jim'),
  ('Khalilur Rahman'),
  ('Md. Aktaruzzaman'),
  ('Md. Mohsin'),
  ('Md. Rashed Mazumder'),
  ('Md. Rashidul Hasan'),
  ('Md. Tahmidur Rahman'),
  ('Md. Takbir Alam'),
  ('Md. Tareq Bashar'),
  ('Md. Tayel Rahman'),
  ('Mr. Mohsin'),
  ('Mr. Rashed Mazumder'),
  ('Rajesh Barua'),
  ('Sadman Sakib Ayan'),
  ('Tazrin Rahman'),
  ('Yeasin Arafat');

-- Assignments (trigger disabled so we don't double-count OUT already seeded) --
alter table assignments disable trigger trg_assignment_stock_sync;
insert into assignments (product_id, employee_id, brand, specification, date_issued, issued_by) values
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Abdullah Almoon'), 'TwinMos', '64 GB', '2026-02-25', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Md. Tahmidur Rahman'), 'TwinMos', '64 GB', '2026-02-25', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Tayel Rahman'), 'Smart', '128 GB', '2026-02-26', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Mohsin'), 'Smart', '128 GB', '2026-02-24', 'Mr. Rashed Mazumder'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Aktaruzzaman'), 'Smart', '128 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Tareq Bashar'), 'Smart', '128 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Rashidul Hasan'), 'Smart', '128 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Md. Takbir Alam'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Takbir Alam'), 'Smart', '128 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Tazrin Rahman'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Tazrin Rahman'), 'Smart', '128 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 32 GB') limit 1), (select id from employees where full_name='Yeasin Arafat'), 'Smart', '32 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Yeasin Arafat'), 'Smart', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Fardin Jim'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Rajesh Barua'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Abdullah Al Mahmud Pias'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Sadman Sakib Ayan'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 64 GB') limit 1), (select id from employees where full_name='Khalilur Rahman'), 'TwinMos', '64 GB', '2026-02-24', 'Mr. Mohsin'),
  ((select id from products where lower(name)=lower('Pendrive 128 GB') limit 1), (select id from employees where full_name='Md. Rashed Mazumder'), 'Smart', '128 GB', '2026-02-24', null);
alter table assignments enable trigger trg_assignment_stock_sync;

commit;
