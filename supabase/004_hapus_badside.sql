-- ================================================================
-- SHAW D'SIX PORTAL — HAPUS SEMUA MODUL BADSIDE/FAMILY
-- Jalankan SETELAH schema.sql, roles_and_permissions.sql, dan
-- 003_duty_dan_komponen.sql. Ini DESTRUKTIF — semua data Badside
-- (badside, anggota, gudang, setoran, log, blacklist) akan HILANG
-- PERMANEN. Backup dulu kalau masih perlu datanya.
-- ================================================================

-- 1. Update check constraint role_mappings biar nggak nolak sebelum
--    kita bersihin barisnya (kalau constraint dari 003 sudah kepasang).
alter table role_mappings drop constraint if exists role_mappings_relation_check;

-- 2. Hapus baris role_mappings yang masih nunjuk ke tipe badside
delete from role_mappings where type in ('member_badside', 'admin_badside');

-- 3. Pasang lagi check constraint tanpa opsi badside
do $$
begin
  alter table role_mappings add constraint role_mappings_relation_check
  check (
    (type in ('member_workshop','admin_workshop') and workshop_id is not null)
    or (type = 'super_admin')
  );
exception when duplicate_object then null;
end $$;

update role_mappings set type = 'member_workshop' where type not in ('member_workshop','admin_workshop','super_admin');

-- 4. Drop kolom badside_id di role_mappings (sudah nggak dipakai)
alter table role_mappings drop column if exists badside_id;

-- 5. Bersihin kolom badside di profile_permissions
alter table profile_permissions drop column if exists admin_badside_ids;
alter table profile_permissions drop column if exists member_badside_ids;

-- 6. Drop semua tabel Badside/Family (cascade biar policy & FK ikut kehapus)
drop table if exists setoran_badside cascade;
drop table if exists log_anggota_badside cascade;
drop table if exists blacklist_badside cascade;
drop table if exists gudang_badside cascade;
drop table if exists anggota_badside cascade;
drop table if exists badside cascade;

-- Kalau ada error "cannot drop ... because other objects depend on it" pas
-- nge-run ini, itu tanda masih ada sisa referensi (mis. fungsi lama). Jalankan
-- ulang bagian yang gagal setelah masalahnya diselesaikan, sisanya aman diulang.
