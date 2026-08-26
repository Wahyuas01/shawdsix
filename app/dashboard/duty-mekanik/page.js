import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'jam_mulai', label: 'Jam Mulai', type: 'time' },
  { name: 'jam_selesai', label: 'Jam Selesai', type: 'time' },
  { name: 'catatan', label: 'Catatan', type: 'textarea' },
  { name: 'foto_on_duty_url', label: 'Screenshot On Duty', type: 'file' },
  { name: 'foto_off_duty_url', label: 'Screenshot Off Duty', type: 'file' },
];

export default async function Page() {
  const supabase = createClient();
  const user = await getCachedUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  let query = supabase.from('duty_mekanik').select('*').order('tanggal', { ascending: false });
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
  // Mekanik boleh lapor duty sendiri lewat Panel Mekanik; ubah/hapus khusus admin workshop.
  const canCreate = perm.isSuperAdmin || ids.length > 0;
  const canEdit = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;
  return <CrudTable table="duty_mekanik" label="Log Duty Mekanik" fields={FIELDS} rows={rows || []} relations={relations} canCreate={canCreate} canEdit={canEdit} />;
}
