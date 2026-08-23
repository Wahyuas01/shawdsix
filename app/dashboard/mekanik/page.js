import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'nama', label: 'Nama Mekanik', type: 'text' },
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Kepala Workshop', 'Senior Mekanik', 'Mekanik', 'Trainee'] },
  { name: 'join_date', label: 'Tanggal Gabung', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  let query = supabase.from('mekanik').select('*').order('created_at', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('workshop_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    query,
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
  return <CrudTable table="mekanik" label="Anggota Mekanik" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />;
}
