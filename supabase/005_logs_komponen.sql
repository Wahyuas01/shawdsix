-- ================================================================
-- SHAW D'SIX PORTAL — LOGS KOMPONEN (ganti Gudang Workshop)
-- Jalankan SETELAH schema.sql, roles_and_permissions.sql, 003, (004 kalau dipakai)
-- ================================================================

-- ------------------------------------------------------------
-- 1. Penanda "periode" per workshop — dipakai buat reset mingguan.
--    Logs Komponen cuma nampilin data SEJAK reset_at terakhir.
-- ------------------------------------------------------------
create table if not exists komponen_period (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid not null unique references workshop(id) on delete cascade,
  reset_at timestamptz not null default now()
);

alter table komponen_period enable row level security;

drop policy if exists "authenticated read komponen_period" on komponen_period;
create policy "authenticated read komponen_period" on komponen_period for select using (auth.role() = 'authenticated');

drop policy if exists "admin_workshop insert komponen_period" on komponen_period;
create policy "admin_workshop insert komponen_period" on komponen_period for insert with check (is_admin_workshop(workshop_id));
drop policy if exists "admin_workshop update komponen_period" on komponen_period;
create policy "admin_workshop update komponen_period" on komponen_period for update using (is_admin_workshop(workshop_id));

-- ------------------------------------------------------------
-- 2. Sederhanakan "Data Komponen": cuma catat Komponen Masuk.
--    Komponen Keluar sudah otomatis kebaca dari setoran_modif.komponen_keluar.
-- ------------------------------------------------------------
alter table komponen_tracking drop column if exists dipakai;
alter table komponen_tracking rename column diberikan to jumlah_masuk;

-- ------------------------------------------------------------
-- 3. Gudang Workshop digantikan Logs Komponen — tabel lama sudah
--    tidak dipakai, aman dihapus. Kalau masih ada data penting di
--    situ (stok/kas manual), backup dulu sebelum jalankan baris ini.
-- ------------------------------------------------------------
drop table if exists gudang_workshop cascade;
