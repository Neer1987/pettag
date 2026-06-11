-- Physical QR tag orders (replacement / spare)

create table if not exists tag_orders (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  owner_name text not null,
  pet_qr_code_id text not null,
  pet_name text not null,
  qr_design_id text not null,
  order_type text not null default 'replacement',
  quantity integer not null default 1 check (quantity >= 1 and quantity <= 5),
  ship_address text not null default '',
  ship_city text not null default '',
  ship_state text not null default '',
  ship_zip text not null default '',
  ship_phone text not null default '',
  notes text not null default '',
  unit_price_cents integer not null,
  total_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists tag_orders_owner_email_idx on tag_orders(owner_email);
create index if not exists tag_orders_created_at_idx on tag_orders(created_at desc);

alter table tag_orders enable row level security;

drop policy if exists "tag_orders_select_anon" on tag_orders;
create policy "tag_orders_select_anon" on tag_orders for select using (true);

drop policy if exists "tag_orders_insert_anon" on tag_orders;
create policy "tag_orders_insert_anon" on tag_orders for insert with check (true);
