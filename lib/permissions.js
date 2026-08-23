/**
 * Ambil profile_permissions user yang sedang login. Dipakai di server
 * component tiap halaman modul untuk (a) menyaring baris yang boleh
 * dilihat dan (b) menentukan apakah tombol Tambah/Edit/Hapus muncul.
 *
 * Ini murni untuk UX (menyembunyikan aksi yang toh akan ditolak).
 * Keamanan sesungguhnya tetap ditegakkan oleh RLS di
 * supabase/roles_and_permissions.sql, bukan oleh kode ini.
 */
export async function getPermissions(supabase, userId) {
  const { data } = await supabase.from('profile_permissions').select('*').eq('id', userId).single();
  return {
    isSuperAdmin: data?.is_super_admin || false,
    adminWorkshopIds: data?.admin_workshop_ids || [],
    memberWorkshopIds: data?.member_workshop_ids || [],
  };
}

export function visibleWorkshopIds(perm) {
  return [...new Set([...perm.adminWorkshopIds, ...perm.memberWorkshopIds])];
}
