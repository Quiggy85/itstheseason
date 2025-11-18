-- Enable required extensions -------------------------------------------------

create extension if not exists "pgcrypto"; -- provides gen_random_uuid()

create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Profiles -------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  marketing_opt_in boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

-- Addresses ------------------------------------------------------------------

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Primary',
  recipient_name text,
  line1 text not null,
  line2 text,
  city text not null,
  county text,
  postcode text not null,
  country_code text not null default 'GBR',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists addresses_profile_id_idx on public.addresses(profile_id);

create trigger update_addresses_updated_at
  before update on public.addresses
  for each row execute procedure public.set_current_timestamp_updated_at();

-- Payment methods -------------------------------------------------------------

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_method_id text not null,
  brand text,
  last4 text,
  exp_month smallint,
  exp_year smallint,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_methods_profile_id_idx on public.payment_methods(profile_id);

create unique index if not exists payment_methods_unique_default
  on public.payment_methods(profile_id)
  where is_default;

create trigger update_payment_methods_updated_at
  before update on public.payment_methods
  for each row execute procedure public.set_current_timestamp_updated_at();

-- Seasonal events -------------------------------------------------------------

create table if not exists public.seasonal_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  auto_rotate boolean not null default true,
  is_active boolean not null default false,
  display_priority integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger update_seasonal_events_updated_at
  before update on public.seasonal_events
  for each row execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.seasonal_event_keywords (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.seasonal_events(id) on delete cascade,
  keyword text not null
);

create unique index if not exists seasonal_event_keywords_unique
  on public.seasonal_event_keywords(event_id, keyword);

insert into public.seasonal_events (slug, name, description, start_date, end_date, display_priority, is_active)
values
  ('january-sales', 'January Sales', 'New Year clearance and deals.', make_date(extract(year from timezone('utc', now()))::int, 1, 1), make_date(extract(year from timezone('utc', now()))::int, 1, 31), 100, false),
  ('valentines', 'Valentine''s Day', 'Gifts for partners and loved ones.', make_date(extract(year from timezone('utc', now()))::int, 2, 1), make_date(extract(year from timezone('utc', now()))::int, 2, 15), 90, false),
  ('mothers-day', 'Mother''s Day', 'Celebrate mums with thoughtful presents.', make_date(extract(year from timezone('utc', now()))::int, 2, 20), make_date(extract(year from timezone('utc', now()))::int, 3, 31), 80, false),
  ('easter', 'Easter', 'Springtime gifts and celebration items.', make_date(extract(year from timezone('utc', now()))::int, 3, 1), make_date(extract(year from timezone('utc', now()))::int, 4, 15), 70, false),
  ('fathers-day', 'Father''s Day', 'Presents for dads and father figures.', make_date(extract(year from timezone('utc', now()))::int, 5, 20), make_date(extract(year from timezone('utc', now()))::int, 6, 30), 60, false),
  ('halloween', 'Halloween', 'Spooky décor, costumes, and treats.', make_date(extract(year from timezone('utc', now()))::int, 10, 1), make_date(extract(year from timezone('utc', now()))::int, 10, 31), 50, false),
  ('black-friday', 'Black Friday', 'Limited-time deals for Black Friday.', make_date(extract(year from timezone('utc', now()))::int, 11, 22), make_date(extract(year from timezone('utc', now()))::int, 11, 30), 40, false),
  ('cyber-monday', 'Cyber Monday', 'Online-only deals.', make_date(extract(year from timezone('utc', now()))::int, 12, 1), make_date(extract(year from timezone('utc', now()))::int, 12, 5), 30, false),
  ('christmas', 'Christmas', 'Festive gifts and decorations.', make_date(extract(year from timezone('utc', now()))::int, 11, 15), make_date(extract(year from timezone('utc', now()))::int, 12, 26), 110, true)
on conflict (slug) do nothing;

insert into public.seasonal_event_keywords (event_id, keyword)
select id, keyword
from public.seasonal_events
join (
  values
    ('january-sales', 'january sale'),
    ('january-sales', 'new year deals'),
    ('valentines', 'valentine gifts'),
    ('valentines', 'romantic'),
    ('mothers-day', 'mother''s day'),
    ('mothers-day', 'mum gifts'),
    ('fathers-day', 'father''s day'),
    ('fathers-day', 'dad gifts'),
    ('easter', 'easter gifts'),
    ('easter', 'spring décor'),
    ('halloween', 'halloween costumes'),
    ('halloween', 'spooky décor'),
    ('black-friday', 'black friday'),
    ('black-friday', 'flash deals'),
    ('cyber-monday', 'cyber monday'),
    ('cyber-monday', 'online deals'),
    ('christmas', 'christmas gifts'),
    ('christmas', 'festive décor')
) as seed(slug, keyword) on seed.slug = public.seasonal_events.slug
on conflict do nothing;

-- Product cache ---------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  cj_product_id text not null,
  event_id uuid references public.seasonal_events(id) on delete set null,
  title text not null,
  slug text,
  price numeric(10, 2) not null,
  currency_code text not null default 'GBP',
  inventory_quantity integer,
  estimated_delivery_min_days integer,
  estimated_delivery_max_days integer,
  shipping_policy text,
  returns_policy text,
  product_metadata jsonb not null,
  media jsonb,
  tags text[] default array[]::text[],
  is_active boolean not null default true,
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_event_id_idx on public.products(event_id);
create unique index if not exists products_cj_product_id_idx on public.products(cj_product_id);

create trigger update_products_updated_at
  before update on public.products
  for each row execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.inventory_snapshots (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  inventory_quantity integer,
  captured_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_snapshots_product_id_idx
  on public.inventory_snapshots(product_id);

-- Orders ----------------------------------------------------------------------

create type public.order_status as enum (
  'pending',
  'processing',
  'fulfilled',
  'cancelled',
  'refunded'
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status public.order_status not null default 'pending',
  total_amount numeric(10, 2) not null,
  currency_code text not null default 'GBP',
  shipping_address_id uuid references public.addresses(id),
  billing_address_id uuid references public.addresses(id),
  delivery_notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_profile_id_idx on public.orders(profile_id);
create index if not exists orders_payment_intent_idx on public.orders(stripe_payment_intent_id);

create trigger update_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  cj_sku text,
  quantity integer not null default 1,
  unit_amount numeric(10, 2) not null,
  currency_code text not null default 'GBP',
  snapshot jsonb not null, -- stores product details at time of purchase
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- Utility function for updated_at triggers ------------------------------------

-- Supabase includes public.set_current_timestamp_updated_at by default when using
-- the dashboard migrations. If running outside that context, ensure the function
-- exists before creating triggers above.

-- Row Level Security ----------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.seasonal_events enable row level security;
alter table public.seasonal_event_keywords enable row level security;
alter table public.products enable row level security;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are editable by owner" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Insert profile for self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Addresses belong to profile owner" on public.addresses
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Payment methods belong to profile owner" on public.payment_methods
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Orders belong to profile owner" on public.orders
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "Order items follow order owner" on public.order_items
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id and o.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id and o.profile_id = auth.uid()
    )
  );

create policy "Products readable by all" on public.products
  for select using (true);

create policy "Seasonal events readable by all" on public.seasonal_events
  for select using (true);

create policy "Seasonal event keywords readable by all" on public.seasonal_event_keywords
  for select using (true);
