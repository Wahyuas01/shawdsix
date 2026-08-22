# Shawi D'SIX Community Portal

Next.js (App Router) + Supabase + Vercel.

## Struktur yang sudah jadi

- `supabase/schema.sql` — **skema database lengkap** untuk semua modul (Badside/Family & Workshop), termasuk RLS dan storage bucket untuk screenshot setoran modif.
- Login via **Discord OAuth** (`/login`, `/auth/callback`).
- Route `/dashboard/*` diproteksi otomatis lewat `middleware.js` — belum login akan dilempar ke `/login`.
- Halaman `/` (Home, publik) menampilkan hero + statistik komunitas langsung dari database.
- `components/CrudTable.js` — komponen CRUD generik (tabel + modal tambah/edit/hapus) yang tersambung ke Supabase.
- `app/dashboard/badside/page.js` — **contoh modul yang sudah 100% jalan**, dipakai sebagai pola untuk 18 modul lainnya.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, klik Run.
3. Buka **Authentication > Providers > Discord**, aktifkan, isi Client ID & Secret dari [Discord Developer Portal](https://discord.com/developers/applications) (buat aplikasi baru → OAuth2 → tambahkan redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Copy `Project URL` dan `anon public key` dari **Project Settings > API**.

## 2. Setup lokal

```bash
cp .env.local.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 3. Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Import repo di [vercel.com/new](https://vercel.com/new).
3. Tambahkan environment variables yang sama (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) di **Project Settings > Environment Variables**.
4. Deploy. Setelah dapat domain Vercel, tambahkan URL itu ke **Site URL** & **Redirect URLs** di Supabase Auth settings, dan sebagai redirect URL tambahan di Discord Developer Portal.

## 4. Menambahkan 18 modul yang tersisa

Tiap modul cuma butuh 1 file baru mengikuti pola `app/dashboard/badside/page.js`. Contoh untuk **Anggota Badside**:

```js
// app/dashboard/anggota-badside/page.js
import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Anggota', type: 'text' },
  { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Leader','Wakil','Senior','Anggota'] },
  { name: 'join_date', label: 'Tanggal Gabung', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif','Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const { data: rows } = await supabase.from('anggota_badside').select('*').order('created_at', { ascending: false });
  return <CrudTable table="anggota_badside" label="Anggota Badside" fields={FIELDS} rows={rows || []} />;
}
```

Tabel & kolom yang tersedia sudah ada semua di `supabase/schema.sql` — tinggal cocokkan `FIELDS` dengan nama kolomnya. Link menu di sidebar (`app/dashboard/layout.js`) sudah disiapkan untuk semua 19 modul, jadi begitu file page-nya dibuat, otomatis nyambung.

### Kolom relasi (dropdown "Badside", "Mekanik", dst)

Modul seperti `anggota_badside`, `setoran_badside`, `mekanik`, dll punya kolom relasi (`badside_id`, `workshop_id`, `mekanik_id`). `CrudTable` versi dasar ini belum render dropdown relasi otomatis — untuk modul dengan relasi, ambil daftar opsinya di server component lalu kirim sebagai prop tambahan ke `CrudTable`, atau perluas `CrudTable` menambahkan tipe field `'relation'` (polanya sama seperti prototype HTML yang sudah dibuat sebelumnya).

### Upload screenshot (Setoran Modif)

Untuk field `foto_sebelum_url` / `foto_sesudah_url`, upload file ke Supabase Storage bucket `setoran-modif` (sudah dibuat lewat `schema.sql`) pakai `supabase.storage.from('setoran-modif').upload(...)`, lalu simpan public URL-nya ke kolom terkait.

## 5. Role & permission

Tabel `profiles` punya kolom `role` (`member`, `pengurus_badside`, `kepala_workshop`, `admin`). Saat ini RLS mengizinkan semua user yang login baca/tulis semua tabel — perketat sesuai kebutuhan (misal hanya `pengurus_badside` boleh edit `gudang_badside`) dengan mengubah policy di `schema.sql` memakai `exists (select 1 from profiles where id = auth.uid() and role = '...')`.
