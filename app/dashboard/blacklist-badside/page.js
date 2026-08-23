import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions } from '@/lib/permissions';

const FIELDS = [
  { name: 'nama', label: 'Nama', type: 'text' },
  { name: 'alasan', label: 'Alasan', type: 'textarea' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'oleh', label: 'Dilaporkan Oleh', type: 'text' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const { data: rows } = await supabase.from('blacklist_badside').select('*').order('tanggal', { ascending: false });
  // Blacklist bersifat lintas-badside; siapa saja yang admin badside (badside manapun) boleh kelola.
  const canManage = perm.isSuperAdmin || perm.adminBadsideIds.length > 0;
  return <CrudTable table="blacklist_badside" label="Blacklist Badside" fields={FIELDS} rows={rows || []} canManage={canManage} />;
}
