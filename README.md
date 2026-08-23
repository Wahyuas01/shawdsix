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
2. Buka **SQL Editor**, jalankan **berurutan**:
   1. `supabase/schema.sql` (semua tabel data)
   2. `supabase/roles_and_permissions.sql` (role Discord, izin admin badside/workshop, RLS bertingkat)
3. Buka **Authentication > Providers > Discord**, aktifkan, isi Client ID & Secret dari [Discord Developer Portal](https://discord.com/developers/applications) (buat aplikasi baru → OAuth2 → tambahkan redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`).
4. Copy `Project URL`, `anon public key`, dan **`service_role` key** dari **Project Settings > API**.

## 2. Setup Discord Bot (untuk baca role member)

Login Discord OAuth cuma dapat identitas user, bukan role servernya. Untuk tahu role server (Gravencio, Admin Workshop, dst) portal ini pakai **Discord Bot** terpisah:

1. Di aplikasi Discord yang sama (Developer Portal), buka tab **Bot** → buat bot → copy **Token**.
2. Di tab Bot, aktifkan **Server Members Intent**.
3. Invite bot itu ke server komunitas kamu (OAuth2 > URL Generator, centang scope `bot`, permission minimal "View Channels" / tanpa permission khusus juga cukup asal bot ada di server).
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
3. Tambahkan SEMUA environment variables dari `.env.local` di **Project Settings > Environment Variables** (termasuk `SUPABASE_SERVICE_ROLE_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` — ini rahasia, jangan pakai prefix `NEXT_PUBLIC_`).
4. Deploy. Setelah dapat domain Vercel, tambahkan URL itu ke **Site URL** & **Redirect URLs** di Supabase Auth settings, dan sebagai redirect URL tambahan di Discord Developer Portal.

## 6. Menghubungkan role Discord ke Badside/Workshop (WAJIB biar sistem izin jalan)

Setelah minimal 1 Badside dan 1 Workshop dibuat (lewat Super Admin, lihat langkah 7), buka **Table Editor > role_mappings** di Supabase, isi baris untuk tiap role Discord yang relevan:

| discord_role_id | label | type | badside_id | workshop_id |
|---|---|---|---|---|
| (ID role "Gravencio" di server) | Gravencio | `member_badside` | (id badside Gravencio Gang Syndicate) | — |
| (ID role "Admin Gravencio") | Admin Gravencio | `admin_badside` | (id badside Gravencio Gang Syndicate) | — |
| (ID role "Mekanik Workshop X") | Mekanik Workshop X | `member_workshop` | — | (id Workshop X) |
| (ID role "Admin Workshop X") | Admin Workshop X | `admin_workshop` | — | (id Workshop X) |
| (ID role "Owner"/"Founder") | Super Admin | `super_admin` | — | — |

Cara dapat `discord_role_id`: aktifkan Developer Mode di Discord, buka Server Settings > Roles, klik kanan role → **Copy Role ID**.

Begitu user klik **Sinkron Role** di halaman Profil (atau otomatis saat login), portal akan:
1. Tanya Discord role apa saja yang dipunya user itu di server.
2. Cocokkan ke `role_mappings`.
3. Simpan hasilnya (badside/workshop mana dia jadi anggota atau admin) ke `profile_permissions`.

Sidebar, isi tabel, dan tombol Tambah/Edit/Hapus otomatis menyesuaikan — mekanik cuma lihat & bisa setor modif workshop-nya sendiri, admin workshop bisa kelola penuh data workshop-nya, dst. Aturan detail per tabel ada di `supabase/roles_and_permissions.sql`.

## 7. Jadi Super Admin pertama kali

Ayam-telur: butuh Super Admin buat mengisi `role_mappings`, tapi `role_mappings` juga yang menentukan siapa Super Admin. Untuk yang pertama kali, isi manual lewat SQL Editor:

```sql
update profile_permissions set is_super_admin = true where id = '<user id kamu, lihat di Authentication > Users>';
```

Setelah itu kamu bisa kelola semuanya (termasuk isi `role_mappings` untuk anggota lain) lewat Table Editor, atau nanti dibuatkan halaman admin khusus di dashboard.

## 8. Halaman mana saja yang sudah menerapkan permission

Modul **Badside** (semua 6 halaman) dan contoh Workshop (**Anggota Mekanik**, **Setoran Modif**) sudah menyaring baris sesuai badside/workshop yang kamu ikuti, dan menyembunyikan tombol Tambah/Edit/Hapus sesuai role (`canManage`, atau `canCreate`/`canEdit` terpisah untuk modul yang bolehnya cuma "tambah sendiri" seperti setoran). Halaman workshop lainnya (Gudang Workshop, Data Komponen, Data Uang, List Gaji, Lamaran Mekanik, Blacklist, Log, Report Mingguan, Rating) masih pola lama (semua user login bisa lihat & pakai tombolnya) — RLS di database tetap menolak aksi yang tidak diizinkan, tapi untuk UX yang rapi, terapkan pola yang sama seperti `app/dashboard/mekanik/page.js`:

```js
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';
// ...
const perm = await getPermissions(supabase, user.id);
const ids = visibleWorkshopIds(perm);
if (!perm.isSuperAdmin) query = query.in('workshop_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
// ...
const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
<CrudTable ... canManage={canManage} />
```

## 9. Kolom relasi (dropdown "Badside", "Mekanik", dst)

`CrudTable` sudah mendukung tipe field `'relation'` — server component tinggal fetch daftar opsi (mis. `supabase.from('badside').select('id, nama')`) dan kirim lewat prop `relations`. Semua modul yang butuh (Anggota Badside, Setoran, Mekanik, Setoran Modif, dll) sudah dikonfigurasi begini.

### Upload screenshot (Setoran Modif)

Field `foto_sebelum_url` / `foto_sesudah_url` di halaman **Setoran Modif** pakai tipe `'file'` — otomatis upload ke Supabase Storage bucket `setoran-modif` (sudah dibuat lewat `schema.sql`) dan menyimpan public URL-nya.

### Chat real-time

Halaman **Chat Komunitas** subscribe ke Supabase Realtime (`postgres_changes` di tabel `chat_messages`), jadi pesan baru langsung muncul di semua browser yang lagi buka halaman itu tanpa perlu refresh.
