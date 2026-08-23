import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleBadsideIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'nama', label: 'Nama Anggota', type: 'text' },
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Leader', 'Wakil', 'Senior', 'Anggota'] },
  { name: 'join_date', label: 'Tanggal Gabung', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleBadsideIds(perm);

  let query = supabase.from('anggota_badside').select('*').order('created_at', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('badside_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const [{ data: rows }, { data: badside }] = await Promise.all([
    query,
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  const canManage = perm.isSuperAdmin || perm.adminBadsideIds.length > 0;
  return <CrudTable table="anggota_badside" label="Anggota Badside" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />;
}
