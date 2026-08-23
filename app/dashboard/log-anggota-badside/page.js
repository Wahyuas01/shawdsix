import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleBadsideIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'anggota_nama', label: 'Nama Anggota', type: 'text' },
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'tipe', label: 'Tipe', type: 'select', options: ['Masuk', 'Keluar', 'Dikeluarkan', 'Warning'] },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleBadsideIds(perm);

  let query = supabase.from('log_anggota_badside').select('*').order('tanggal', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('badside_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const [{ data: rows }, { data: badside }] = await Promise.all([
    query,
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  const canManage = perm.isSuperAdmin || perm.adminBadsideIds.length > 0;
  return <CrudTable table="log_anggota_badside" label="Log Anggota Badside" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />;
}
