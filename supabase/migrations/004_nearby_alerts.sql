-- Nearby lost pet alerts: user locations, lost coordinates, notification inbox

alter table owners
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_updated_at timestamptz,
  add column if not exists push_token text,
  add column if not exists alerts_enabled boolean not null default true;

alter table pets
  add column if not exists lost_latitude double precision,
  add column if not exists lost_longitude double precision;

create table if not exists alert_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  pet_qr_code_id text not null,
  pet_name text not null,
  distance_km double precision not null default 0,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alert_notifications_recipient_idx
  on alert_notifications(recipient_email, created_at desc);

create index if not exists owners_alerts_enabled_idx
  on owners(alerts_enabled) where alerts_enabled = true;

create index if not exists pets_is_lost_coords_idx
  on pets(is_lost, lost_latitude, lost_longitude) where is_lost = true;

alter table alert_notifications enable row level security;

drop policy if exists "alert_notifications_select_anon" on alert_notifications;
create policy "alert_notifications_select_anon"
  on alert_notifications for select using (true);

drop policy if exists "alert_notifications_insert_anon" on alert_notifications;
create policy "alert_notifications_insert_anon"
  on alert_notifications for insert with check (true);

drop policy if exists "alert_notifications_update_anon" on alert_notifications;
create policy "alert_notifications_update_anon"
  on alert_notifications for update using (true);

drop policy if exists "alert_notifications_delete_anon" on alert_notifications;
create policy "alert_notifications_delete_anon"
  on alert_notifications for delete using (true);

-- Optional: enable Realtime for alert_notifications in Dashboard → Database → Replication

-- Backfill alerts_enabled for existing owners
update owners set alerts_enabled = true where alerts_enabled is null;
