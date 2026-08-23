# Shaw D'SIX Community Portal

Next.js (App Router) + Supabase + Vercel. Fokus portal ini: **Workshop & Mekanik**, plus **Panel Warga** untuk anggota komunitas umum.

> Modul Badside/Family sudah dihapus total dari portal ini (lihat `supabase/004_hapus_badside.sql`).

## Struktur yang sudah jadi

- `supabase/schema.sql` — skema database dasar (Workshop, chat, dll).
- `supabase/roles_and_permissions.sql` — role Discord, izin admin workshop, RLS bertingkat.
- `supabase/003_duty_dan_komponen.sql` — Log Duty Mekanik, kolom Komponen Keluar/Sisa Komponen, izin lamaran terbuka.
- `supabase/004_hapus_badside.sql` — **DESTRUKTIF**, hapus semua tabel & data Badside/Family.
- Login via **Discord OAuth** (`/login`, `/auth/callback`).
- Route `/dashboard/*` diproteksi otomatis lewat `middleware.js` — belum login akan dilempar ke `/login`.
- Halaman `/` (Home, publik) menampilkan hero + statistik Workshop & Mekanik langsung dari database.
- `components/CrudTable.js` — komponen CRUD generik (tabel + modal tambah/edit/hapus, mendukung dropdown relasi & upload screenshot) yang tersambung ke Supabase.
- **Semua modul Workshop tersambung ke Supabase**: Workshop, Anggota Mekanik, Gudang Workshop, Setoran Modif (+ screenshot & komponen keluar/sisa), Log Duty Mekanik, Data Komponen, Data Uang, List Gaji, Lamaran Mekanik, Blacklist, Log Anggota, Report Mingguan, Rating Mekanik.
- **Chat Komunitas** pakai Supabase Realtime — pesan baru langsung muncul tanpa refresh.
- **Panel Mekanik Saya** — buat mekanik: setor hasil modif, lapor duty, lihat gaji & rating sendiri.
- **Panel Warga** — buat yang belum jadi mekanik: lihat daftar mekanik, ajukan lamaran, pantau log keluar/masuk/warning.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan **berurutan**:
   1. `supabase/schema.sql`
   2. `supabase/roles_and_permissions.sql`
   3. `supabase/003_duty_dan_komponen.sql`
   4. `supabase/004_hapus_badside.sql` (skip kalau kamu belum pernah bikin modul Badside di database ini sama sekali)
3. Buka **Authentication > Providers > Discord**, aktifkan, isi Client ID & Secret dari [Discord Developer Portal](https://discord.com/developers/applications) (buat aplikasi baru → OAuth2 → tambahkan redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Copy `Project URL`, `anon public key`, dan **`service_role` key** dari **Project Settings > API**.

## 2. Setup Discord Bot (untuk baca role member)

Login Discord OAuth cuma dapat identitas user, bukan role servernya. Untuk tahu role server portal ini pakai **Discord Bot** terpisah:

1. Di aplikasi Discord yang sama (Developer Portal), buka tab **Bot** → buat bot → copy **Token**.
2. Di tab Bot, aktifkan **Server Members Intent**.
3. Invite bot itu ke server komunitas kamu (OAuth2 > URL Generator, centang scope `bot`).
4. Aktifkan Developer Mode di Discord (Settings > Advanced), klik kanan nama server → **Copy Server ID**.

## 3. Setup lokal

```bash
cp .env.local.example .env.local
# isi semua env var (Supabase URL/anon key/service role key, Discord bot token, guild id)
npm install
npm run dev
```

## 4. Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Import repo di [vercel.com/new](https://vercel.com/new).
3. Tambahkan SEMUA environment variables dari `.env.local` (termasuk `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` — rahasia, jangan pakai prefix `NEXT_PUBLIC_`).
4. Deploy. Setelah dapat domain Vercel, tambahkan URL itu ke **Site URL** & **Redirect URLs** di Supabase Auth settings, dan sebagai redirect URL tambahan di Discord Developer Portal.

## 5. Jadi Super Admin pertama kali

```sql
update profile_permissions set is_super_admin = true where id = '<user id kamu, lihat di Authentication > Users>';
```

## 6. Menghubungkan role Discord ke Workshop (WAJIB biar sistem izin jalan)

Buka halaman **/dashboard/role-mappings** (Super Admin only), isi baris untuk tiap role Discord:

| discord_role_id | label | type | workshop_id |
|---|---|---|---|
| (ID role "Mekanik Workshop X") | Mekanik Workshop X | `member_workshop` | (id Workshop X) |
| (ID role "Admin Workshop X") | Admin Workshop X | `admin_workshop` | (id Workshop X) |
| (ID role "Owner"/"Founder") | Super Admin | `super_admin` | — |

Cara dapat `discord_role_id`: Developer Mode aktif → Server Settings > Roles → klik kanan role → **Copy Role ID**.

Begitu user klik **Sinkron Role** di halaman Profil, portal akan:
1. Tanya Discord role apa saja yang dipunya user itu.
2. Cocokkan ke `role_mappings`.
3. Simpan hasilnya ke `profile_permissions`, dan otomatis bikin/update baris `mekanik` miliknya.

Sinkron **tidak pernah menurunkan** status Super Admin yang sudah aktif — itu cuma bisa diturunkan manual lewat SQL/Table Editor.

## 7. Kontrol izin per halaman

Setiap halaman modul Workshop pakai `lib/permissions.js` buat (a) nyaring baris sesuai workshop yang kamu ikuti, (b) sembunyiin tombol Tambah/Edit/Hapus sesuai role:

```js
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';
const perm = await getPermissions(supabase, user.id);
const ids = visibleWorkshopIds(perm);
if (!perm.isSuperAdmin) query = query.in('workshop_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
<CrudTable ... canManage={canManage} />
```

RLS di `roles_and_permissions.sql` tetap jadi penegak utama — kode di atas murni buat UX.

## 8. Upload screenshot & realtime

- **Setoran Modif**: field `foto_sebelum_url` / `foto_sesudah_url` pakai tipe `'file'` di `CrudTable`, otomatis upload ke bucket `setoran-modif`.
- **Chat Komunitas**: subscribe ke Supabase Realtime (`postgres_changes` tabel `chat_messages`).
