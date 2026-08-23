-- ================================================================
-- SHAW D'SIX PORTAL — UPDATE: Duty Mekanik, Komponen di Setoran Modif
-- Jalankan SETELAH schema.sql dan roles_and_permissions.sql
-- ================================================================

-- ------------------------------------------------------------
-- 0. Jaga-jaga: pastikan kolom profile_id sudah ada (harusnya sudah
--    dibuat oleh roles_and_permissions.sql — baris ini aman diulang).
-- ------------------------------------------------------------
alter table anggota_badside add column if not exists profile_id uuid references profiles(id) on delete set null;
alter table mekanik add column if not exists profile_id uuid references profiles(id) on delete set null;

-- ------------------------------------------------------------
-- 1. Tambah kolom "Komponen Keluar" & "Sisa Komponen" di Setoran Modif
-- ------------------------------------------------------------
alter table setoran_modif add column if not exists komponen_keluar numeric default 0;
alter table setoran_modif add column if not exists sisa_komponen numeric default 0;

-- ------------------------------------------------------------
-- 2. Tabel Duty Mekanik (laporan jam kerja / shift)
-- ------------------------------------------------------------
create table if not exists duty_mekanik (
  id uuid primary key default uuid_generate_v4(),
  workshop_id uuid references workshop(id) on delete cascade,
  mekanik_id uuid references mekanik(id) on delete cascade,
  tanggal date default current_date,
  jam_mulai time,
  jam_selesai time,
  catatan text,
  created_at timestamptz default now()
);

alter table duty_mekanik enable row level security;

drop policy if exists "authenticated read duty_mekanik" on duty_mekanik;
create policy "authenticated read duty_mekanik" on duty_mekanik for select using (auth.role() = 'authenticated');

-- Mekanik boleh lapor duty miliknya sendiri; admin_workshop/admin bebas semua.
drop policy if exists "self or admin insert duty_mekanik" on duty_mekanik;
create policy "self or admin insert duty_mekanik" on duty_mekanik for insert with check (
  is_any_workshop_admin()
  or mekanik_id in (select id from mekanik where profile_id = auth.uid())
);
drop policy if exists "self or admin update duty_mekanik" on duty_mekanik;
create policy "self or admin update duty_mekanik" on duty_mekanik for update using (
  is_any_workshop_admin()
  or mekanik_id in (select id from mekanik where profile_id = auth.uid())
);
drop policy if exists "admin delete duty_mekanik" on duty_mekanik;
create policy "admin delete duty_mekanik" on duty_mekanik for delete using (is_any_workshop_admin());

-- ------------------------------------------------------------
-- 4. Lamaran Mekanik: siapa saja yang login boleh apply (insert),
--    tapi hanya admin_workshop/admin yang boleh ubah statusnya.
-- ------------------------------------------------------------
drop policy if exists "admin_workshop write lamaran_mekanik" on lamaran_mekanik;
create policy "authenticated apply lamaran_mekanik" on lamaran_mekanik for insert with check (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 5. Cegah role_mappings kesimpen "kosong" lagi ke depannya
--    (tipe badside wajib isi Badside, tipe workshop wajib isi Workshop)
-- ------------------------------------------------------------
do $$
begin
  alter table role_mappings add constraint role_mappings_relation_check
  check (
    (type in ('member_badside','admin_badside') and badside_id is not null)
    or (type in ('member_workshop','admin_workshop') and workshop_id is not null)
    or (type = 'super_admin')
  ) not valid;
exception when duplicate_object then null;
end $$;
