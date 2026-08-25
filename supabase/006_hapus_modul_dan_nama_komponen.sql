-- ================================================================
-- SHAW D'SIX PORTAL — HAPUS MODUL DATA UANG, LOGS ANGGOTA,
-- RATING MEKANIK, REPORT MINGGUAN, LAMARAN MEKANIK
-- + hilangkan kolom nama komponen (generik "Komponen" saja)
-- Jalankan SETELAH 005_logs_komponen.sql. Ini DESTRUKTIF.
-- Backup dulu kalau masih perlu datanya.
-- ================================================================

drop table if exists keuangan_workshop cascade;
drop table if exists logs_workshop cascade;
drop table if exists rating_mekanik cascade;
drop table if exists report_mingguan cascade;
drop table if exists lamaran_mekanik cascade;

-- Kolom nama komponen (teks bebas) sudah tidak dipakai — komponen
-- sekarang cuma dihitung jumlahnya, bukan dibedakan namanya.
alter table komponen_tracking drop column if exists komponen;
