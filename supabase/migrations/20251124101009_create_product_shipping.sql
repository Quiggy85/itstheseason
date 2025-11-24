create table if not exists public.product_shipping (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  avasam_sku text not null,
  service_id integer,
  service_name text,
  warehouse_id integer,
  warehouse_name text,
  shipping_cost numeric,
  shipping_cost_inc_vat numeric,
  currency text,
  dispatch_days integer,
  delivery_min_days integer,
  delivery_max_days integer,
  raw jsonb,
  last_synced_at timestamptz not null default timezone('utc', now()),
  unique (avasam_sku)
);

create index if not exists product_shipping_avasam_sku_idx on public.product_shipping (avasam_sku);
