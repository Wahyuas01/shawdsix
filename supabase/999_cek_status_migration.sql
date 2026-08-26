-- ================================================================
-- CEK STATUS MIGRATION — jalankan ini di SQL Editor Supabase
-- buat lihat migration mana yang sudah/belum kejalanin.
-- ================================================================
select
  'roles_and_permissions.sql' as migration,
  exists (select 1 from information_schema.tables where table_name = 'profile_permissions') as sudah_jalan
union all
select '003_duty_dan_komponen.sql',
  exists (select 1 from information_schema.tables where table_name = 'duty_mekanik')
union all
select '004_hapus_badside.sql',
  not exists (select 1 from information_schema.tables where table_name = 'badside')
union all
select '005_logs_komponen.sql',
  exists (select 1 from information_schema.tables where table_name = 'komponen_period')
union all
select '006_hapus_modul_dan_nama_komponen.sql',
  not exists (select 1 from information_schema.tables where table_name = 'lamaran_mekanik')
union all
select '007_akses_publik_home.sql',
  exists (
    select 1 from pg_policies
    where tablename = 'workshop' and policyname = 'public read workshop'
  );
