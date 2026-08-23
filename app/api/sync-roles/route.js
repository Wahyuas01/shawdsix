import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGuildMemberRoles } from '@/lib/discord';
import { NextResponse } from 'next/server';

/**
 * Alur:
 * 1. Pastikan user sudah login (pakai cookie session biasa).
 * 2. Ambil discord_id dari profiles.
 * 3. Tanya Discord (lewat bot token) role apa saja yang dia punya di server.
 * 4. Cocokkan ke role_mappings (diisi admin lewat Table Editor / halaman Role Mappings).
 * 5. Tulis hasilnya ke profile_permissions pakai service role key (bypass RLS —
 *    inilah satu-satunya jalur yang boleh mengubah tabel ini).
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Belum login' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin.from('profiles').select('discord_id, discord_username').eq('id', user.id).single();
  if (!profile?.discord_id) {
    return NextResponse.json({ error: 'discord_id tidak ditemukan di profil. Coba logout lalu login ulang lewat Discord.' }, { status: 400 });
  }

  let discordRoleIds;
  try {
    discordRoleIds = await getGuildMemberRoles(profile.discord_id);
  } catch (err) {
    return NextResponse.json({ error: 'Gagal menghubungi Discord: ' + err.message }, { status: 502 });
  }

  const { data: mappings } = await admin
    .from('role_mappings')
    .select('*')
    .in('discord_role_id', discordRoleIds.length ? discordRoleIds : ['__none__']);

  const { data: existingPerms } = await admin
    .from('profile_permissions')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const result = {
    // Super Admin yang sudah aktif (mis. di-set manual lewat SQL) TIDAK PERNAH
    // diturunkan otomatis oleh sinkron ini — sinkron cuma boleh MENAIKKAN status,
    // bukan menurunkan, supaya nggak ada yang kehilangan akses admin cuma
    // gara-gara belum ada role_mappings tipe 'super_admin' yang cocok.
    is_super_admin: existingPerms?.is_super_admin || false,
    admin_badside_ids: [],
    member_badside_ids: [],
    admin_workshop_ids: [],
    member_workshop_ids: [],
    synced_at: new Date().toISOString(),
  };

  for (const m of mappings || []) {
    if (m.type === 'super_admin') result.is_super_admin = true;
    if (m.type === 'admin_badside' && m.badside_id) result.admin_badside_ids.push(m.badside_id);
    if (m.type === 'member_badside' && m.badside_id) result.member_badside_ids.push(m.badside_id);
    if (m.type === 'admin_workshop' && m.workshop_id) result.admin_workshop_ids.push(m.workshop_id);
    if (m.type === 'member_workshop' && m.workshop_id) result.member_workshop_ids.push(m.workshop_id);
  }
  // dedup
  result.admin_badside_ids = [...new Set(result.admin_badside_ids)];
  result.member_badside_ids = [...new Set(result.member_badside_ids)];
  result.admin_workshop_ids = [...new Set(result.admin_workshop_ids)];
  result.member_workshop_ids = [...new Set(result.member_workshop_ids)];

  await admin.from('profile_permissions').upsert({ id: user.id, ...result });

  // Sinkron juga baris anggota_badside / mekanik miliknya supaya otomatis
  // muncul di data modul (badside pertama / workshop pertama yang cocok).
  const allBadsideIds = [...result.admin_badside_ids, ...result.member_badside_ids];
  if (allBadsideIds.length) {
    const { data: existing } = await admin.from('anggota_badside').select('id').eq('profile_id', user.id).maybeSingle();
    if (existing) {
      await admin.from('anggota_badside').update({ badside_id: allBadsideIds[0], status: 'Aktif' }).eq('id', existing.id);
    } else {
      await admin.from('anggota_badside').insert({
        nama: profile.discord_username || 'Anggota',
        badside_id: allBadsideIds[0],
        profile_id: user.id,
        status: 'Aktif',
        jabatan: result.admin_badside_ids.includes(allBadsideIds[0]) ? 'Leader' : 'Anggota',
      });
    }
  }

  const allWorkshopIds = [...result.admin_workshop_ids, ...result.member_workshop_ids];
  if (allWorkshopIds.length) {
    const { data: existing } = await admin.from('mekanik').select('id').eq('profile_id', user.id).maybeSingle();
    if (existing) {
      await admin.from('mekanik').update({ workshop_id: allWorkshopIds[0], status: 'Aktif' }).eq('id', existing.id);
    } else {
      await admin.from('mekanik').insert({
        nama: profile.discord_username || 'Mekanik',
        workshop_id: allWorkshopIds[0],
        profile_id: user.id,
        status: 'Aktif',
        jabatan: result.admin_workshop_ids.includes(allWorkshopIds[0]) ? 'Kepala Workshop' : 'Mekanik',
      });
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
