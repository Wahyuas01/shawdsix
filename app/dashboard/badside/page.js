import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleBadsideIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'nama', label: 'Nama Badside', type: 'text' },
  { name: 'leader', label: 'Leader', type: 'text' },
  { name: 'deskripsi', label: 'Deskripsi', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function BadsidePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleBadsideIds(perm);

  let query = supabase.from('badside').select('*').order('created_at', { ascending: false });
  if (!perm.isSuperAdmin) query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const { data: rows } = await query;

  // Membuat/menghapus Badside baru hanya untuk Super Admin (lihat roles_and_permissions.sql).
  return <CrudTable table="badside" label="Badside" fields={FIELDS} rows={rows || []} canManage={perm.isSuperAdmin} />;
}
