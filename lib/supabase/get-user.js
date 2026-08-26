import { cache } from 'react';
import { createClient } from './server';

/**
 * auth.getUser() itu network call ke server Supabase (bukan cuma baca cookie),
 * jadi kalau dipanggil berkali-kali di layout.js + page.js + komponen lain
 * dalam satu request yang sama, itu jadi beberapa round-trip jaringan yang
 * numpuk dan bikin halaman berasa lambat.
 *
 * React `cache()` membuat panggilan ini di-dedupe otomatis — dalam satu
 * request yang sama, network call cuma jalan SEKALI walau dipanggil dari
 * banyak tempat (layout, page, dst). Request berikutnya tetap dapat data segar.
 *
 * Pakai ini di server component, ganti pola lama:
 *   const { data: { user } } = await supabase.auth.getUser();
 * jadi:
 *   const user = await getCachedUser();
 */
export const getCachedUser = cache(async () => {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    // Sesi kadaluwarsa/nggak valid (mis. web ditinggal lama). Jangan biarin
    // ini nge-throw dan bikin Server Component crash — anggap belum login,
    // biar halaman yang manggil ini redirect ke /login secara normal.
    return null;
  }
});
