-- ================================================================
-- CLEANUP — jalankan ini dulu di SQL Editor sebelum re-run schema.sql
-- Ini akan MENGHAPUS semua tabel & datanya. Aman dijalankan berkali-kali.
-- ================================================================

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists chat_messages cascade;
drop table if exists rating_mekanik cascade;
drop table if exists report_mingguan cascade;
drop table if exists logs_workshop cascade;
drop table if exists blacklist_workshop cascade;
drop table if exists lamaran_mekanik cascade;
drop table if exists gaji cascade;
drop table if exists keuangan_workshop cascade;
drop table if exists komponen_tracking cascade;
drop table if exists setoran_modif cascade;
drop table if exists gudang_workshop cascade;
drop table if exists mekanik cascade;
drop table if exists workshop cascade;

drop table if exists blacklist_badside cascade;
drop table if exists log_anggota_badside cascade;
drop table if exists setoran_badside cascade;
drop table if exists gudang_badside cascade;
drop table if exists anggota_badside cascade;
drop table if exists badside cascade;

drop table if exists profiles cascade;

-- hapus policy storage (kalau sudah sempat dibuat) — bucket & object-nya
-- tidak bisa dihapus lewat SQL langsung, itu dibatasi Supabase.
-- Kalau bucket "setoran-modif" sudah sempat kebuat dan mau dihapus,
-- lakukan lewat Dashboard: Storage > pilih bucket "setoran-modif" > Delete bucket.
drop policy if exists "authenticated upload screenshot" on storage.objects;
drop policy if exists "public read screenshot" on storage.objects;
