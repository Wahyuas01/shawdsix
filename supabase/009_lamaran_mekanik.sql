-- ================================================================
-- SHAW D'SIX PORTAL — LAMARAN MEKANIK (dibuat ulang, field baru)
-- Satu user cuma boleh punya SATU lamaran berstatus 'Pending' di satu
-- waktu — begitu admin ubah status (Diterima/Ditolak), baru boleh
-- apply lagi. Ditegakkan dua lapis: RLS (cegah insert) + unique index
-- partial (jaminan di level database, sekalian kasih error rapi).
-- ================================================================

create table if not exists lamaran_mekanik (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  ucp text,
  nama_ic text,
  umur_ic numeric,
  umur_ooc numeric,
  family text default 'Tidak ada',
  foto_ucp_family_url text,
  foto_stat_warning_url text,
  foto_umur_url text,
  status text not null default 'Pending' check (status in ('Pending','Diterima','Ditolak')),
  catatan text,
  tanggal date default current_date,
  created_at timestamptz default now()
);

-- Jaminan di level database: satu profile_id cuma boleh punya SATU baris
-- berstatus Pending. Insert kedua kalau masih ada yang Pending akan
-- ditolak Postgres dengan kode error 23505 (unique violation).
create unique index if not exists lamaran_mekanik_satu_pending_per_user
  on lamaran_mekanik (profile_id) where status = 'Pending';

alter table lamaran_mekanik enable row level security;

-- Baca: pelamar cuma boleh lihat lamaran MILIKNYA SENDIRI (ada data pribadi/screenshot ID),
-- admin workshop/super admin boleh lihat semua.
drop policy if exists "select own or admin lamaran_mekanik" on lamaran_mekanik;
create policy "select own or admin lamaran_mekanik" on lamaran_mekanik for select using (
  is_any_workshop_admin() or profile_id = auth.uid()
);

-- Insert: siapa aja yang login boleh apply, TAPI ditolak kalau dia masih
-- punya lamaran berstatus Pending yang belum direspon admin.
drop policy if exists "self insert lamaran_mekanik" on lamaran_mekanik;
create policy "self insert lamaran_mekanik" on lamaran_mekanik for insert with check (
  profile_id = auth.uid()
  and not exists (
    select 1 from lamaran_mekanik l where l.profile_id = auth.uid() and l.status = 'Pending'
  )
);

-- Update/delete: cuma admin workshop yang bersangkutan (atau super admin).
drop policy if exists "admin update lamaran_mekanik" on lamaran_mekanik;
create policy "admin update lamaran_mekanik" on lamaran_mekanik for update using (
  is_admin_workshop(workshop_id)
);
drop policy if exists "admin delete lamaran_mekanik" on lamaran_mekanik;
create policy "admin delete lamaran_mekanik" on lamaran_mekanik for delete using (
  is_admin_workshop(workshop_id)
);
