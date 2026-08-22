-- ================================================================
-- SHAW D'SIX COMMUNITY PORTAL — SUPABASE SCHEMA
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ================================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES (terhubung ke auth.users, diisi otomatis via trigger)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_username text,
  avatar_url text,
  role text not null default 'member', -- member | pengurus_badside | kepala_workshop | admin
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, discord_username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- BADSIDE / FAMILY
-- ------------------------------------------------------------
create table if not exists badside (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  leader text,
  deskripsi text,
  status text default 'Aktif',
  created_at timestamptz default now()
);

create table if not exists anggota_badside (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  badside_id uuid references badside(id) on delete set null,
  jabatan text,
  join_date date,
  status text default 'Aktif',
  created_at timestamptz default now()
);

create table if not exists gudang_badside (
  id uuid primary key default uuid_generate_v4(),
  badside_id uuid references badside(id) on delete cascade,
  ikan numeric default 0,
  komponen numeric default 0,
  material numeric default 0,
  uang numeric default 0,
  marjun numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists setoran_badside (
  id uuid primary key default uuid_generate_v4(),
  badside_id uuid references badside(id) on delete cascade,
  anggota_id uuid references anggota_badside(id) on delete set null,
  tanggal date default current_date,
  ikan numeric default 0,
  komponen numeric default 0,
  material numeric default 0,
  uang numeric default 0,
  marjun numeric default 0,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists log_anggota_badside (
  id uuid primary key default uuid_generate_v4(),
  anggota_nama text,
  badside_id uuid references badside(id) on delete set null,
  tipe text check (tipe in ('Masuk','Keluar','Dikeluarkan','Warning')),
  tanggal date default current_date,
  keterangan text,
  created_at timestamptz default now()
);

create table if not exists blacklist_badside (
  id uuid primary key default uuid_generate_v4(),
  nama text,
  alasan text,
  tanggal date default current_date,
  oleh text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- WORKSHOP
-- ------------------------------------------------------------
create table if not exists workshop (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  lokasi text,
  deskripsi text,
  status text default 'Aktif',
  created_at timestamptz default now()
);

create table if not exists mekanik (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  workshop_id uuid references workshop(id) on delete set null,
  jabatan text,
  join_date date,
  status text default 'Aktif',
  created_at timestamptz default now()
);

create table if not exists gudang_workshop (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  komponen text,
  stok numeric default 0,
  uang numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists setoran_modif (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  mekanik_id uuid references mekanik(id) on delete set null,
  tanggal date default current_date,
  jumlah numeric default 0,
  foto_sebelum_url text,
  foto_sesudah_url text,
  catatan text,
  created_at timestamptz default now()
);

create table if not exists komponen_tracking (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  mekanik_id uuid references mekanik(id) on delete set null,
  komponen text,
  diberikan numeric default 0,
  dipakai numeric default 0,
  tanggal date default current_date,
  created_at timestamptz default now()
);

create table if not exists keuangan_workshop (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  tanggal date default current_date,
  tipe text check (tipe in ('Masuk','Keluar')),
  jumlah numeric default 0,
  keterangan text,
  created_at timestamptz default now()
);

create table if not exists gaji (
  id uuid primary key default uuid_generate_v4(),
  mekanik_id uuid references mekanik(id) on delete cascade,
  periode text,
  jumlah numeric default 0,
  status text default 'Belum Dibayar' check (status in ('Belum Dibayar','Sudah Dibayar')),
  tanggal_bayar date,
  created_at timestamptz default now()
);

create table if not exists lamaran_mekanik (
  id uuid primary key default uuid_generate_v4(),
  nama text,
  workshop_id uuid references workshop(id) on delete set null,
  tanggal date default current_date,
  status text default 'Pending' check (status in ('Pending','Diterima','Ditolak')),
  catatan text,
  created_at timestamptz default now()
);

create table if not exists blacklist_workshop (
  id uuid primary key default uuid_generate_v4(),
  nama text,
  alasan text,
  tanggal date default current_date,
  oleh text,
  created_at timestamptz default now()
);

create table if not exists logs_workshop (
  id uuid primary key default uuid_generate_v4(),
  mekanik_nama text,
  workshop_id uuid references workshop(id) on delete set null,
  tipe text check (tipe in ('Masuk','Keluar','Naik Jabatan','Blacklist','Warning')),
  tanggal date default current_date,
  keterangan text,
  created_at timestamptz default now()
);

create table if not exists report_mingguan (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  periode text,
  total_setoran numeric default 0,
  total_pengeluaran numeric default 0,
  ringkasan text,
  created_at timestamptz default now()
);

create table if not exists rating_mekanik (
  id uuid primary key default uuid_generate_v4(),
  mekanik_id uuid references mekanik(id) on delete cascade,
  dari_nama text,
  rating int check (rating between 1 and 5),
  komentar text,
  tanggal date default current_date,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references profiles(id) on delete set null,
  sender_name text,
  pesan text not null,
  channel text default 'general', -- general | badside | workshop
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Aturan dasar: semua user yang sudah login (authenticated) bisa
-- baca & tulis. Perketat per-role (pengurus_badside/kepala_workshop/
-- admin) belakangan lewat kolom profiles.role sesuai kebutuhan.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','badside','anggota_badside','gudang_badside','setoran_badside',
    'log_anggota_badside','blacklist_badside','workshop','mekanik','gudang_workshop',
    'setoran_modif','komponen_tracking','keuangan_workshop','gaji','lamaran_mekanik',
    'blacklist_workshop','logs_workshop','report_mingguan','rating_mekanik','chat_messages'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "authenticated read %1$s" on %1$I;', t);
    execute format('create policy "authenticated read %1$s" on %1$I for select using (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists "authenticated write %1$s" on %1$I;', t);
    execute format('create policy "authenticated write %1$s" on %1$I for insert with check (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists "authenticated update %1$s" on %1$I;', t);
    execute format('create policy "authenticated update %1$s" on %1$I for update using (auth.role() = ''authenticated'');', t);
    execute format('drop policy if exists "authenticated delete %1$s" on %1$I;', t);
    execute format('create policy "authenticated delete %1$s" on %1$I for delete using (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

-- profiles: user hanya boleh update profil sendiri (override policy generik di atas)
drop policy if exists "authenticated update profiles" on profiles;
create policy "user updates own profile" on profiles for update using (auth.uid() = id);

-- ------------------------------------------------------------
-- REALTIME untuk chat (biar pesan baru langsung muncul)
-- ------------------------------------------------------------
alter publication supabase_realtime add table chat_messages;

-- ------------------------------------------------------------
-- STORAGE BUCKET untuk screenshot setoran modif
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('setoran-modif', 'setoran-modif', true)
on conflict (id) do nothing;

drop policy if exists "authenticated upload screenshot" on storage.objects;
create policy "authenticated upload screenshot"
on storage.objects for insert
with check (bucket_id = 'setoran-modif' and auth.role() = 'authenticated');

drop policy if exists "public read screenshot" on storage.objects;
create policy "public read screenshot"
on storage.objects for select
using (bucket_id = 'setoran-modif');
