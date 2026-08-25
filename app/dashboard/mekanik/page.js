import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
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
  const user = await getCachedUser();
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
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 bg-blue-50 text-brandblue-700 rounded-lg px-3 py-2">
        Anggota mekanik cuma bisa masuk otomatis lewat sinkron role Discord (atur di halaman Role Mappings). Admin cuma bisa edit jabatan/status atau hapus, nggak bisa tambah manual.
      </p>
      <CrudTable table="mekanik" label="Anggota Mekanik" fields={FIELDS} rows={rows || []} relations={relations} canCreate={false} canEdit={canManage} />
    </div>
  );
}
