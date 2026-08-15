create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  brand text,
  price numeric(14,2) not null default 0,
  old_price numeric(14,2),
  description text,
  image_url text,
  specs jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  in_stock boolean not null default true,
  stock_quantity integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select using (active=true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

drop policy if exists "Anyone create order" on public.orders;
create policy "Anyone create order" on public.orders for insert to anon,authenticated with check (true);
drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

drop policy if exists "Anyone create message" on public.contact_messages;
create policy "Anyone create message" on public.contact_messages for insert to anon,authenticated with check (true);
drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

drop policy if exists "Admin reads own row" on public.admin_users;
create policy "Admin reads own row" on public.admin_users for select to authenticated using (user_id=auth.uid());

insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict(id) do update set public=true;

drop policy if exists "Public product images" on storage.objects;
create policy "Public product images" on storage.objects for select using (bucket_id='product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects for insert to authenticated
with check (bucket_id='product-images' and exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

-- AFTER creating the admin user in Authentication > Users, run this separately:
-- insert into public.admin_users (user_id,email)
-- select id,email from auth.users where email='YOUR-ADMIN-EMAIL@example.com'
-- on conflict(user_id) do update set email=excluded.email;
