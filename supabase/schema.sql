-- ============================================================
-- GMAX Technology Ltd — Supabase schema
-- Run this in Supabase SQL editor (Project -> SQL Editor -> New query)
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone registers
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  image_url text,
  category text,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default to_char(now(), 'YYMMDD') || substr(replace(gen_random_uuid()::text,'-',''),1,6),
  user_id uuid references profiles(id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_address text,
  status text not null default 'pending', -- pending | confirmed | fulfilled | cancelled
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Order items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity int not null default 1,
  unit_price numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Profiles: users see/edit their own row; admins see all
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- Products: anyone can read; only admins can write
create policy "products_public_read" on products
  for select using (true);
create policy "products_admin_write" on products
  for insert with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "products_admin_update" on products
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "products_admin_delete" on products
  for delete using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Orders: anyone (incl. guests) can create an order; owners + admins can read; only admins can update status
create policy "orders_insert_anyone" on orders
  for insert with check (true);
create policy "orders_select_own_or_admin" on orders
  for select using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "orders_admin_update" on orders
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Order items follow the parent order's visibility
create policy "order_items_insert_anyone" on order_items
  for insert with check (true);
create policy "order_items_select_via_order" on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id
      and (o.user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
    )
  );

-- ============================================================
-- After running this: make yourself admin. In SQL editor run:
--   update profiles set is_admin = true where email = 'your-login-email@gmail.com';
-- (register on the site first so the profile row exists)
-- ============================================================

-- Real GMAX product listings (edit prices/stock/images any time from /admin/products)
insert into products (name, slug, description, price, category, image_url, in_stock) values
  ('Dell Latitude 5440 (i5)', 'dell-latitude-5440-i5',
   '13th Generation Intel® Core™ i5-1345U vPro
Windows 11 Pro, 64-bit
Intel® Iris® Xe Graphics', 1250000, 'Laptops', null, true),
  ('Dell Latitude 5530', 'dell-latitude-5530',
   'Dell Latitude 5530 Business Laptop
15.6" FHD Display
12th Gen Intel Core i5-1235U', 950000, 'Laptops', null, true),
  ('HP Laptop 14s-dq5086nia', 'hp-laptop-14s-dq5086nia',
   'HP 14s-dq5086nia
12th Gen
Intel® Core™ i3-1215U', 530000, 'Laptops', null, true)
on conflict (slug) do nothing;
