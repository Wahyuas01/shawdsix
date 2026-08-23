import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'jumlah', label: 'Jumlah Setoran (Rp)', type: 'number' },
  { name: 'foto_sebelum_url', label: 'Screenshot Sebelum', type: 'file' },
  { name: 'foto_sesudah_url', label: 'Screenshot Sesudah', type: 'file' },
  { name: 'catatan', label: 'Catatan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  let query = supabase.from('setoran_modif').select('*').order('tanggal', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('workshop_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const [{ data: rows }, { data: workshop }, { data: mekanik }] = await Promise.all([
    query,
    supabase.from('workshop').select('id, nama'),
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = {
    workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })),
    mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })),
  };
  // Mekanik (member workshop) boleh setor sendiri, ubah/hapus khusus admin workshop.
  const canCreate = perm.isSuperAdmin || ids.length > 0;
  const canEdit = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
  return <CrudTable table="setoran_modif" label="Setoran Modif" fields={FIELDS} rows={rows || []} relations={relations} canCreate={canCreate} canEdit={canEdit} />;
}
