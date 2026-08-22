# Shaw D'SIX Community Portal

Next.js (App Router) + Supabase + Vercel.

## Struktur yang sudah jadi

- `supabase/schema.sql` — **skema database lengkap** untuk semua modul (Badside/Family & Workshop), termasuk RLS dan storage bucket untuk screenshot setoran modif.
- Login via **Discord OAuth** (`/login`, `/auth/callback`).
- Route `/dashboard/*` diproteksi otomatis lewat `middleware.js` — belum login akan dilempar ke `/login`.
- Halaman `/` (Home, publik) menampilkan hero + statistik komunitas langsung dari database.
- `components/CrudTable.js` — komponen CRUD generik (tabel + modal tambah/edit/hapus, mendukung dropdown relasi & upload screenshot) yang tersambung ke Supabase.
- **Semua 19 modul Badside/Family & Workshop sudah jadi dan tersambung ke Supabase**, termasuk dropdown relasi (mis. pilih Badside/Mekanik) dan upload screenshot untuk Setoran Modif.
- **Chat Komunitas** pakai Supabase Realtime — pesan baru langsung muncul di semua browser yang terbuka tanpa refresh.

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

## 4. Semua modul sudah lengkap

Ke-19 modul (6 Badside/Family + 13 Workshop termasuk Chat) sudah punya halaman sendiri di `app/dashboard/<nama-modul>/page.js`, semuanya mengikuti pola yang sama seperti `badside/page.js`: server component ambil data + daftar relasi dari Supabase, lalu render `<CrudTable>`.

Kalau nanti mau nambah modul baru, tinggal duplikasi salah satu file yang sudah ada, sesuaikan nama tabel & `FIELDS`-nya, dan tambahkan link barunya di `app/dashboard/layout.js`.

### Kolom relasi (dropdown "Badside", "Mekanik", dst)

`CrudTable` sudah mendukung tipe field `'relation'` — server component tinggal fetch daftar opsi (mis. `supabase.from('badside').select('id, nama')`) dan kirim lewat prop `relations`. Semua modul yang butuh (Anggota Badside, Setoran, Mekanik, Setoran Modif, dll) sudah dikonfigurasi begini.

### Upload screenshot (Setoran Modif)

Field `foto_sebelum_url` / `foto_sesudah_url` di halaman **Setoran Modif** pakai tipe `'file'` — otomatis upload ke Supabase Storage bucket `setoran-modif` (sudah dibuat lewat `schema.sql`) dan menyimpan public URL-nya.

### Chat real-time

Halaman **Chat Komunitas** subscribe ke Supabase Realtime (`postgres_changes` di tabel `chat_messages`), jadi pesan baru langsung muncul di semua browser yang lagi buka halaman itu tanpa perlu refresh.

## 5. Role & permission

Tabel `profiles` punya kolom `role` (`member`, `pengurus_badside`, `kepala_workshop`, `admin`). Saat ini RLS mengizinkan semua user yang login baca/tulis semua tabel — perketat sesuai kebutuhan (misal hanya `pengurus_badside` boleh edit `gudang_badside`) dengan mengubah policy di `schema.sql` memakai `exists (select 1 from profiles where id = auth.uid() and role = '...')`.
