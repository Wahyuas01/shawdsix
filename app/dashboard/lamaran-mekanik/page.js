import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import CrudTable from '@/components/CrudTable';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop Tujuan', type: 'relation', rel: 'workshop' },
  { name: 'nama_ic', label: 'Nama IC', type: 'text' },
  { name: 'ucp', label: 'UCP', type: 'text' },
  { name: 'umur_ic', label: 'Umur IC', type: 'number' },
  { name: 'umur_ooc', label: 'Umur OOC', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Diterima', 'Ditolak'] },
  { name: 'foto_ucp_family_url', label: 'Screenshot UCP Kelihatan Family', type: 'file' },
  { name: 'foto_stat_warning_url', label: 'Screenshot Stat Warning', type: 'file' },
  { name: 'foto_umur_url', label: 'Screenshot Umur', type: 'file' },
  { name: 'family', label: 'Family', type: 'text' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'catatan', label: 'Catatan Admin', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const user = await getCachedUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  let query = supabase.from('lamaran_mekanik').select('*').order('created_at', { ascending: false });
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
        Warga apply lewat Panel Warga mereka sendiri, jadi di sini nggak ada tombol Tambah. Ubah status ke &quot;Diterima&quot;/&quot;Ditolak&quot; buat merespon — begitu direspon, pelamar otomatis boleh apply lagi kalau perlu.
      </p>
      <CrudTable table="lamaran_mekanik" label="Lamaran Mekanik" fields={FIELDS} rows={rows || []} relations={relations} canCreate={false} canEdit={canManage} />
    </div>
  );
}
