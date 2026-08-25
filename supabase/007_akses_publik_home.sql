-- ================================================================
-- SHAW D'SIX PORTAL — BUKA AKSES BACA PUBLIK
-- Statistik & leaderboard di Home (halaman publik, tanpa login)
-- butuh baca tabel ini walau pengunjung belum login. Sebelumnya
-- dibatasi cuma buat authenticated, jadi Home bakal nampilin 0/kosong
-- buat pengunjung yang belum login. Jalankan ini biar publik beneran.
-- ================================================================

drop policy if exists "authenticated read workshop" on workshop;
create policy "public read workshop" on workshop for select using (true);

drop policy if exists "authenticated read mekanik" on mekanik;
create policy "public read mekanik" on mekanik for select using (true);

drop policy if exists "authenticated read setoran_modif" on setoran_modif;
create policy "public read setoran_modif" on setoran_modif for select using (true);
