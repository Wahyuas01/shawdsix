import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'mekanik_id', label: 'Diberikan ke Mekanik (opsional)', type: 'relation', rel: 'mekanik' },
  { name: 'jumlah_masuk', label: 'Komponen Masuk', type: 'number' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  let query = supabase.from('komponen_tracking').select('*').order('tanggal', { ascending: false });
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
  const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
  return <CrudTable table="komponen_tracking" label="Data Komponen (Masuk)" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />;
}
