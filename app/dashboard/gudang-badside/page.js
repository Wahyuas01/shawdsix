import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleBadsideIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'ikan', label: 'Ikan', type: 'number' },
  { name: 'komponen', label: 'Komponen', type: 'number' },
  { name: 'material', label: 'Material', type: 'number' },
  { name: 'uang', label: 'Uang (Rp)', type: 'number' },
  { name: 'marjun', label: 'Marjun', type: 'number' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleBadsideIds(perm);

  let query = supabase.from('gudang_badside').select('*').order('updated_at', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('badside_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const [{ data: rows }, { data: badside }] = await Promise.all([
    query,
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  const canManage = perm.isSuperAdmin || perm.adminBadsideIds.length > 0;
  return <CrudTable table="gudang_badside" label="Gudang Badside" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />;
}
