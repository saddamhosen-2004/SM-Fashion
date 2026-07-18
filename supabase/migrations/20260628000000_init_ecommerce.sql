-- Drop existing policies if they exist (clean setup)
drop policy if exists "Allow users to view own profile" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow admin to insert profiles" on public.profiles;
drop policy if exists "Allow public read access to categories" on public.categories;
drop policy if exists "Allow admin write access to categories" on public.categories;
drop policy if exists "Allow public read access to products" on public.products;
drop policy if exists "Allow admin write access to products" on public.products;
drop policy if exists "Allow public read access to product images" on public.product_images;
drop policy if exists "Allow admin write access to product images" on public.product_images;
drop policy if exists "Allow customers to view own orders" on public.orders;
drop policy if exists "Allow customers to place orders" on public.orders;
drop policy if exists "Allow admin and staff to update orders" on public.orders;
drop policy if exists "Allow customers to view own order items" on public.order_items;
drop policy if exists "Allow customers to insert own order items" on public.order_items;
drop policy if exists "Allow admin and staff to manage order items" on public.order_items;
drop policy if exists "Allow customers to view own payments" on public.payments;
drop policy if exists "Allow admin and staff to manage payments" on public.payments;
drop policy if exists "Allow admin and staff to view expenses" on public.expenses;
drop policy if exists "Allow admin to manage expenses" on public.expenses;
drop policy if exists "Allow admin and staff to view suppliers" on public.suppliers;
drop policy if exists "Allow admin to manage suppliers" on public.suppliers;
drop policy if exists "Allow admin and staff to view purchases" on public.purchases;
drop policy if exists "Allow admin to manage purchases" on public.purchases;
drop policy if exists "Allow admin and staff to view purchase items" on public.purchase_items;
drop policy if exists "Allow admin to manage purchase items" on public.purchase_items;
drop policy if exists "Allow admin and staff to view inventory" on public.inventory;
drop policy if exists "Allow admin and staff to manage inventory" on public.inventory;
drop policy if exists "Allow public read access to banners" on public.banners;
drop policy if exists "Allow admin to manage banners" on public.banners;

-- Create tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  address text,
  role text default 'customer' check (role in ('customer', 'admin', 'staff')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null,
  discount_price numeric(10,2),
  cost_price numeric(10,2) not null default 0.00,
  sku text unique,
  stock_quantity integer not null default 0,
  unit text not null default 'piece',
  is_active boolean default true not null,
  is_featured boolean default false not null,
  low_stock_threshold integer default 5 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  url text not null,
  alt text,
  display_order integer default 0 not null,
  is_primary boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(10,2) not null,
  discount_amount numeric(10,2) default 0.00 not null,
  shipping_charge numeric(10,2) default 0.00 not null,
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'unpaid', 'partial')),
  payment_method text not null check (payment_method in ('cod', 'bkash', 'nagad', 'bank')),
  shipping_address jsonb not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  amount numeric(10,2) not null,
  method text not null,
  reference_no text,
  paid_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric(10,2) not null,
  category text not null check (category in ('rent', 'salary', 'utility', 'transport', 'marketing', 'other')),
  date date not null default current_date,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  email text,
  address text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  supplier_id uuid references public.suppliers(id) on delete set null,
  total_amount numeric(10,2) not null,
  paid_amount numeric(10,2) not null default 0.00,
  due_amount numeric(10,2) not null default 0.00,
  invoice_no text,
  date date not null default current_date,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.purchase_items (
  id uuid default gen_random_uuid() primary key,
  purchase_id uuid references public.purchases(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  cost_per_unit numeric(10,2) not null,
  total_cost numeric(10,2) not null
);

create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null,
  type text not null check (type in ('in', 'out', 'adjustment')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  link_url text,
  display_order integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.inventory enable row level security;
alter table public.banners enable row level security;

-- Helper functions for role checks
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_admin_or_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
end;
$$ language plpgsql security definer;

-- Profiles policies
create policy "Allow users to view own profile" on public.profiles
  for select using (auth.uid() = id or is_admin_or_staff());

create policy "Allow users to update own profile" on public.profiles
  for update using (auth.uid() = id or is_admin());

create policy "Allow admin to insert profiles" on public.profiles
  for insert with check (is_admin());

-- Categories policies
create policy "Allow public read access to categories" on public.categories
  for select using (true);

create policy "Allow admin write access to categories" on public.categories
  for all using (is_admin());

-- Products policies
create policy "Allow public read access to products" on public.products
  for select using (true);

create policy "Allow admin write access to products" on public.products
  for all using (is_admin());

-- Product Images policies
create policy "Allow public read access to product images" on public.product_images
  for select using (true);

create policy "Allow admin write access to product images" on public.product_images
  for all using (is_admin());

-- Orders policies
create policy "Allow customers to view own orders" on public.orders
  for select using (auth.uid() = customer_id or is_admin_or_staff());

create policy "Allow customers to place orders" on public.orders
  for insert with check (auth.uid() = customer_id);

create policy "Allow admin and staff to update orders" on public.orders
  for update using (is_admin_or_staff());

-- Order Items policies
create policy "Allow customers to view own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.customer_id = auth.uid() or is_admin_or_staff())
    )
  );

create policy "Allow customers to insert own order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.customer_id = auth.uid()
    )
  );

create policy "Allow admin and staff to manage order items" on public.order_items
  for all using (is_admin_or_staff());

-- Payments policies
create policy "Allow customers to view own payments" on public.payments
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
      and (orders.customer_id = auth.uid() or is_admin_or_staff())
    )
  );

create policy "Allow admin and staff to manage payments" on public.payments
  for all using (is_admin_or_staff());

-- Expenses policies
create policy "Allow admin and staff to view expenses" on public.expenses
  for select using (is_admin_or_staff());

create policy "Allow admin to manage expenses" on public.expenses
  for all using (is_admin());

-- Suppliers policies
create policy "Allow admin and staff to view suppliers" on public.suppliers
  for select using (is_admin_or_staff());

create policy "Allow admin to manage suppliers" on public.suppliers
  for all using (is_admin());

-- Purchases policies
create policy "Allow admin and staff to view purchases" on public.purchases
  for select using (is_admin_or_staff());

create policy "Allow admin to manage purchases" on public.purchases
  for all using (is_admin());

-- Purchase Items policies
create policy "Allow admin and staff to view purchase items" on public.purchase_items
  for select using (is_admin_or_staff());

create policy "Allow admin to manage purchase items" on public.purchase_items
  for all using (is_admin());

-- Inventory policies
create policy "Allow admin and staff to view inventory" on public.inventory
  for select using (is_admin_or_staff());

create policy "Allow admin and staff to manage inventory" on public.inventory
  for all using (is_admin_or_staff());

-- Banners policies
create policy "Allow public read access to banners" on public.banners
  for select using (true);

create policy "Allow admin to manage banners" on public.banners
  for all using (is_admin());

-- Trigger function for creating profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, address, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run handle_new_user on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
