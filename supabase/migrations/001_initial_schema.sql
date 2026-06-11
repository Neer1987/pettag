-- PetTag initial schema
-- Run in Supabase SQL Editor or via Supabase CLI

create extension if not exists pgcrypto;

create table if not exists owners (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  email_verified boolean not null default false,
  active_pet_qr_code_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references owners(id) on delete cascade,
  qr_code_id text not null unique,
  profile_slug text not null,
  name text not null,
  species text not null,
  gender text not null default '',
  coat text not null default '',
  breed text not null default '',
  age text not null default '',
  weight text not null default '',
  markings jsonb not null default '[]'::jsonb,
  microchip text not null default '',
  notes text not null default '',
  cover_photo_uri text,
  media jsonb not null default '[]'::jsonb,
  qr_design_id text not null default 'classic-forest',
  is_lost boolean not null default false,
  lost_at timestamptz,
  last_seen_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pets_owner_id_idx on pets(owner_id);
create index if not exists pets_qr_code_id_idx on pets(qr_code_id);
create index if not exists pets_is_lost_idx on pets(is_lost) where is_lost = true;

create table if not exists otp_codes (
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (email, code)
);

create index if not exists otp_codes_email_idx on otp_codes(email);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  pet_qr_code_id text not null,
  pet_name text not null,
  sender_name text not null,
  sender_email text not null default '',
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_recipient_email_idx on messages(recipient_email);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists owners_updated_at on owners;
create trigger owners_updated_at
  before update on owners
  for each row execute function set_updated_at();

drop trigger if exists pets_updated_at on pets;
create trigger pets_updated_at
  before update on pets
  for each row execute function set_updated_at();

alter table owners enable row level security;
alter table pets enable row level security;
alter table otp_codes enable row level security;
alter table messages enable row level security;

-- MVP policies for anon client (replace with auth.uid() policies when Supabase Auth is added)
drop policy if exists "owners_select_public" on owners;
create policy "owners_select_public" on owners for select using (true);

drop policy if exists "owners_insert_anon" on owners;
create policy "owners_insert_anon" on owners for insert with check (true);

drop policy if exists "owners_update_anon" on owners;
create policy "owners_update_anon" on owners for update using (true);

drop policy if exists "pets_select_public" on pets;
create policy "pets_select_public" on pets for select using (true);

drop policy if exists "pets_insert_anon" on pets;
create policy "pets_insert_anon" on pets for insert with check (true);

drop policy if exists "pets_update_anon" on pets;
create policy "pets_update_anon" on pets for update using (true);

drop policy if exists "pets_delete_anon" on pets;
create policy "pets_delete_anon" on pets for delete using (true);

drop policy if exists "otp_all_anon" on otp_codes;
create policy "otp_all_anon" on otp_codes for all using (true) with check (true);

drop policy if exists "messages_select_anon" on messages;
create policy "messages_select_anon" on messages for select using (true);

drop policy if exists "messages_insert_anon" on messages;
create policy "messages_insert_anon" on messages for insert with check (true);

drop policy if exists "messages_update_anon" on messages;
create policy "messages_update_anon" on messages for update using (true);
