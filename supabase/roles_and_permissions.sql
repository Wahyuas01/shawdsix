-- ================================================================
-- SHAW D'SIX — ROLES & PERMISSIONS (jalankan SETELAH schema.sql)
-- Versi ini FOKUS WORKSHOP SAJA — sudah tidak ada dependensi ke
-- tabel Badside sama sekali (modul Badside sudah dihapus dari produk).
-- Aman dijalankan berkali-kali (idempotent) dan aman dijalankan
-- di database yang tidak pernah punya tabel Badside sama sekali.
-- ================================================================

-- ------------------------------------------------------------
-- 1. Tambahan kolom identitas Discord di profiles
-- ------------------------------------------------------------
alter table profiles add column if not exists discord_id text unique;
alter table profiles add column if not exists discord_roles jsonb default '[]'::jsonb;

-- ------------------------------------------------------------
-- 2. profile_permissions — HASIL SINKRON role Discord.
-- Terpisah dari `profiles` supaya user (lewat anon key) TIDAK BISA
-- mengubah izinnya sendiri. Hanya diisi oleh server (service role)
-- lewat /api/sync-roles setelah verifikasi ke Discord.
-- ------------------------------------------------------------
create table if not exists profile_permissions (
  id uuid primary key references profiles(id) on delete cascade,
  is_super_admin boolean not null default false,
  admin_workshop_ids uuid[] not null default '{}',
  member_workshop_ids uuid[] not null default '{}',
  synced_at timestamptz
);

alter table profile_permissions enable row level security;
drop policy if exists "authenticated read permissions" on profile_permissions;
create policy "authenticated read permissions" on profile_permissions for select using (auth.role() = 'authenticated');
-- SENGAJA tidak ada policy insert/update/delete untuk role authenticated —
-- hanya service role (dipakai server, bypass RLS) yang boleh menulis tabel ini.

-- ------------------------------------------------------------
-- 3. role_mappings — pemetaan Discord Role ID -> Workshop
-- Contoh isi (lihat README untuk cara isi lewat halaman Role Mappings):
--   discord_role_id='333...', type='member_workshop', workshop_id=<id Workshop X>
--   discord_role_id='444...', type='admin_workshop',  workshop_id=<id Workshop X>
--   discord_role_id='555...', type='super_admin'
-- ------------------------------------------------------------
create table if not exists role_mappings (
  id uuid primary key default uuid_generate_v4(),
  discord_role_id text unique not null,
  label text not null,
  type text not null check (type in ('member_workshop','admin_workshop','super_admin')),
  workshop_id uuid references workshop(id) on delete cascade,
  created_at timestamptz default now()
);

alter table role_mappings enable row level security;
drop policy if exists "authenticated read role_mappings" on role_mappings;
create policy "authenticated read role_mappings" on role_mappings for select using (auth.role() = 'authenticated');
-- Kebijakan insert/update/delete untuk role_mappings (butuh fungsi is_super_admin(),
-- makanya ditaruh di bawah dekat fungsi-fungsi helper, lihat bagian 5b.

-- ------------------------------------------------------------
-- 4. Trigger: buat baris profile_permissions default saat user baru daftar,
-- dan simpan discord_id-nya.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, discord_id, discord_username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  insert into public.profile_permissions (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 5. Helper functions untuk RLS
-- ------------------------------------------------------------
create or replace function is_super_admin() returns boolean as $$
  select coalesce((select is_super_admin from profile_permissions where id = auth.uid()), false);
$$ language sql security definer stable;

create or replace function is_admin_workshop(wid uuid) returns boolean as $$
  select is_super_admin() or coalesce((select wid = any(admin_workshop_ids) from profile_permissions where id = auth.uid()), false);
$$ language sql security definer stable;

create or replace function is_member_workshop(wid uuid) returns boolean as $$
  select is_admin_workshop(wid) or coalesce((select wid = any(member_workshop_ids) from profile_permissions where id = auth.uid()), false);
$$ language sql security definer stable;

create or replace function is_any_workshop_admin() returns boolean as $$
  select is_super_admin() or coalesce((select array_length(admin_workshop_ids,1) > 0 from profile_permissions where id = auth.uid()), false);
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 5b. role_mappings: buka insert/update/delete untuk Super Admin
-- (dipakai halaman /dashboard/role-mappings di web). Ditaruh di sini
-- karena butuh fungsi is_super_admin() yang baru saja didefinisikan.
-- ------------------------------------------------------------
drop policy if exists "super admin insert role_mappings" on role_mappings;
create policy "super admin insert role_mappings" on role_mappings for insert with check (is_super_admin());
drop policy if exists "super admin update role_mappings" on role_mappings;
create policy "super admin update role_mappings" on role_mappings for update using (is_super_admin()) with check (is_super_admin());
drop policy if exists "super admin delete role_mappings" on role_mappings;
create policy "super admin delete role_mappings" on role_mappings for delete using (is_super_admin());

-- ------------------------------------------------------------
-- 6. RLS bertingkat per tabel Workshop (menggantikan policy generik
-- "authenticated write" dari schema.sql). Pola: SELECT tetap terbuka
-- untuk semua yang login (transparansi komunitas); INSERT/UPDATE/DELETE
-- dibatasi sesuai peran.
-- ------------------------------------------------------------

drop policy if exists "authenticated write workshop" on workshop;
drop policy if exists "authenticated update workshop" on workshop;
drop policy if exists "authenticated delete workshop" on workshop;
drop policy if exists "insert workshop" on workshop;
create policy "insert workshop" on workshop for insert with check (is_super_admin());
drop policy if exists "update workshop" on workshop;
create policy "update workshop" on workshop for update using (is_admin_workshop(id)) with check (is_admin_workshop(id));
drop policy if exists "delete workshop" on workshop;
create policy "delete workshop" on workshop for delete using (is_super_admin());

drop policy if exists "authenticated write mekanik" on mekanik;
drop policy if exists "authenticated update mekanik" on mekanik;
drop policy if exists "authenticated delete mekanik" on mekanik;
drop policy if exists "insert mekanik" on mekanik;
create policy "insert mekanik" on mekanik for insert with check (is_admin_workshop(workshop_id));
drop policy if exists "update mekanik" on mekanik;
create policy "update mekanik" on mekanik for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
drop policy if exists "delete mekanik" on mekanik;
create policy "delete mekanik" on mekanik for delete using (is_admin_workshop(workshop_id));

-- Catatan: gudang_workshop, keuangan_workshop, lamaran_mekanik, logs_workshop,
-- report_mingguan, rating_mekanik dihapus total di migration 005/006 —
-- blok di bawah dibungkus pengecekan "kalau tabelnya masih ada", jadi aman
-- dijalankan baik SEBELUM maupun SESUDAH migration itu.

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'gudang_workshop') then
    drop policy if exists "authenticated write gudang_workshop" on gudang_workshop;
    drop policy if exists "authenticated update gudang_workshop" on gudang_workshop;
    drop policy if exists "authenticated delete gudang_workshop" on gudang_workshop;
    drop policy if exists "insert gudang_workshop" on gudang_workshop;
    create policy "insert gudang_workshop" on gudang_workshop for insert with check (is_admin_workshop(workshop_id));
    drop policy if exists "update gudang_workshop" on gudang_workshop;
    create policy "update gudang_workshop" on gudang_workshop for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
    drop policy if exists "delete gudang_workshop" on gudang_workshop;
    create policy "delete gudang_workshop" on gudang_workshop for delete using (is_admin_workshop(workshop_id));
  end if;
end $$;

-- setoran_modif: mekanik (member workshop) boleh setor sendiri; ubah/hapus admin workshop.
drop policy if exists "authenticated write setoran_modif" on setoran_modif;
drop policy if exists "authenticated update setoran_modif" on setoran_modif;
drop policy if exists "authenticated delete setoran_modif" on setoran_modif;
drop policy if exists "insert setoran_modif" on setoran_modif;
create policy "insert setoran_modif" on setoran_modif for insert with check (is_member_workshop(workshop_id));
drop policy if exists "update setoran_modif" on setoran_modif;
create policy "update setoran_modif" on setoran_modif for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
drop policy if exists "delete setoran_modif" on setoran_modif;
create policy "delete setoran_modif" on setoran_modif for delete using (is_admin_workshop(workshop_id));

drop policy if exists "authenticated write komponen_tracking" on komponen_tracking;
drop policy if exists "authenticated update komponen_tracking" on komponen_tracking;
drop policy if exists "authenticated delete komponen_tracking" on komponen_tracking;
drop policy if exists "insert komponen_tracking" on komponen_tracking;
create policy "insert komponen_tracking" on komponen_tracking for insert with check (is_admin_workshop(workshop_id));
drop policy if exists "update komponen_tracking" on komponen_tracking;
create policy "update komponen_tracking" on komponen_tracking for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
drop policy if exists "delete komponen_tracking" on komponen_tracking;
create policy "delete komponen_tracking" on komponen_tracking for delete using (is_admin_workshop(workshop_id));

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'keuangan_workshop') then
    drop policy if exists "authenticated write keuangan_workshop" on keuangan_workshop;
    drop policy if exists "authenticated update keuangan_workshop" on keuangan_workshop;
    drop policy if exists "authenticated delete keuangan_workshop" on keuangan_workshop;
    drop policy if exists "insert keuangan_workshop" on keuangan_workshop;
    create policy "insert keuangan_workshop" on keuangan_workshop for insert with check (is_admin_workshop(workshop_id));
    drop policy if exists "update keuangan_workshop" on keuangan_workshop;
    create policy "update keuangan_workshop" on keuangan_workshop for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
    drop policy if exists "delete keuangan_workshop" on keuangan_workshop;
    create policy "delete keuangan_workshop" on keuangan_workshop for delete using (is_admin_workshop(workshop_id));
  end if;
end $$;

-- gaji: workshop-nya diturunkan lewat relasi ke mekanik
drop policy if exists "authenticated write gaji" on gaji;
drop policy if exists "authenticated update gaji" on gaji;
drop policy if exists "authenticated delete gaji" on gaji;
drop policy if exists "insert gaji" on gaji;
create policy "insert gaji" on gaji for insert with check (
  exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
);
drop policy if exists "update gaji" on gaji;
create policy "update gaji" on gaji for update using (
  exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
) with check (
  exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
);
drop policy if exists "delete gaji" on gaji;
create policy "delete gaji" on gaji for delete using (
  exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
);

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'lamaran_mekanik') then
    drop policy if exists "authenticated write lamaran_mekanik" on lamaran_mekanik;
    drop policy if exists "authenticated update lamaran_mekanik" on lamaran_mekanik;
    drop policy if exists "authenticated delete lamaran_mekanik" on lamaran_mekanik;
    drop policy if exists "insert lamaran_mekanik" on lamaran_mekanik;
    create policy "insert lamaran_mekanik" on lamaran_mekanik for insert with check (auth.role() = 'authenticated');
    drop policy if exists "update lamaran_mekanik" on lamaran_mekanik;
    create policy "update lamaran_mekanik" on lamaran_mekanik for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
    drop policy if exists "delete lamaran_mekanik" on lamaran_mekanik;
    create policy "delete lamaran_mekanik" on lamaran_mekanik for delete using (is_admin_workshop(workshop_id));
  end if;
end $$;

drop policy if exists "authenticated write blacklist_workshop" on blacklist_workshop;
drop policy if exists "authenticated update blacklist_workshop" on blacklist_workshop;
drop policy if exists "authenticated delete blacklist_workshop" on blacklist_workshop;
drop policy if exists "insert blacklist_workshop" on blacklist_workshop;
create policy "insert blacklist_workshop" on blacklist_workshop for insert with check (is_any_workshop_admin());
drop policy if exists "update blacklist_workshop" on blacklist_workshop;
create policy "update blacklist_workshop" on blacklist_workshop for update using (is_any_workshop_admin()) with check (is_any_workshop_admin());
drop policy if exists "delete blacklist_workshop" on blacklist_workshop;
create policy "delete blacklist_workshop" on blacklist_workshop for delete using (is_any_workshop_admin());

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'logs_workshop') then
    drop policy if exists "authenticated write logs_workshop" on logs_workshop;
    drop policy if exists "authenticated update logs_workshop" on logs_workshop;
    drop policy if exists "authenticated delete logs_workshop" on logs_workshop;
    drop policy if exists "insert logs_workshop" on logs_workshop;
    create policy "insert logs_workshop" on logs_workshop for insert with check (is_admin_workshop(workshop_id));
    drop policy if exists "update logs_workshop" on logs_workshop;
    create policy "update logs_workshop" on logs_workshop for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
    drop policy if exists "delete logs_workshop" on logs_workshop;
    create policy "delete logs_workshop" on logs_workshop for delete using (is_admin_workshop(workshop_id));
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'report_mingguan') then
    drop policy if exists "authenticated write report_mingguan" on report_mingguan;
    drop policy if exists "authenticated update report_mingguan" on report_mingguan;
    drop policy if exists "authenticated delete report_mingguan" on report_mingguan;
    drop policy if exists "insert report_mingguan" on report_mingguan;
    create policy "insert report_mingguan" on report_mingguan for insert with check (is_admin_workshop(workshop_id));
    drop policy if exists "update report_mingguan" on report_mingguan;
    create policy "update report_mingguan" on report_mingguan for update using (is_admin_workshop(workshop_id)) with check (is_admin_workshop(workshop_id));
    drop policy if exists "delete report_mingguan" on report_mingguan;
    create policy "delete report_mingguan" on report_mingguan for delete using (is_admin_workshop(workshop_id));
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'rating_mekanik') then
    drop policy if exists "authenticated write rating_mekanik" on rating_mekanik;
    drop policy if exists "authenticated update rating_mekanik" on rating_mekanik;
    drop policy if exists "authenticated delete rating_mekanik" on rating_mekanik;
    drop policy if exists "insert rating_mekanik" on rating_mekanik;
    create policy "insert rating_mekanik" on rating_mekanik for insert with check (auth.role() = 'authenticated');
    drop policy if exists "update rating_mekanik" on rating_mekanik;
    create policy "update rating_mekanik" on rating_mekanik for update using (
      exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
    ) with check (
      exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
    );
    drop policy if exists "delete rating_mekanik" on rating_mekanik;
    create policy "delete rating_mekanik" on rating_mekanik for delete using (
      exists (select 1 from mekanik m where m.id = mekanik_id and is_admin_workshop(m.workshop_id))
    );
  end if;
end $$;

-- chat_messages & profiles sengaja dibiarkan seperti di schema.sql (semua user login boleh chat).

-- ------------------------------------------------------------
-- 7. Perketat profiles: cabut izin insert/delete generik dari schema.sql
-- (harusnya cuma trigger on_auth_user_created yang bikin baris profil baru,
-- dan tidak ada yang boleh hapus profil orang lain lewat client).
-- ------------------------------------------------------------
drop policy if exists "authenticated write profiles" on profiles;
drop policy if exists "authenticated delete profiles" on profiles;

-- ------------------------------------------------------------
-- 8. Kolom profile_id — link satu baris mekanik ke satu akun login
-- (dipakai buat "data punya sendiri" di Panel Mekanik & sinkron Discord).
-- ------------------------------------------------------------
alter table mekanik add column if not exists profile_id uuid references profiles(id) on delete set null;

-- Paksa PostgREST refresh cache skema, biar kolom baru langsung kebaca API
-- (tanpa ini, API kadang masih "lupa" kolom yang baru ditambah sampai
-- project di-restart manual).
notify pgrst, 'reload schema';
