import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import CrudTable from '@/components/CrudTable';
import PeriodResetButton from '@/components/PeriodResetButton';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';

const FIELDS = [
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'periode', label: 'Periode', type: 'text' },
  { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['Belum Dibayar', 'Sudah Dibayar'] },
  { name: 'tanggal_bayar', label: 'Tanggal Bayar', type: 'date' },
];

export default async function Page() {
  const supabase = createClient();
  const user = await getCachedUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);

  // Tabel gaji nggak punya kolom workshop_id langsung (cuma mekanik_id),
  // jadi buat non-super-admin, kita ambil dulu daftar mekanik di workshop
  // yang mereka kelola, baru filter gaji berdasarkan mekanik_id itu.
  let mekanikIds = null;
  if (!perm.isSuperAdmin) {
    const { data: mekList } = await supabase.from('mekanik').select('id').in('workshop_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    mekanikIds = (mekList || []).map((m) => m.id);
  }

  let query = supabase.from('gaji').select('*').order('created_at', { ascending: false });
  if (mekanikIds) query = query.in('mekanik_id', mekanikIds.length ? mekanikIds : ['00000000-0000-0000-0000-000000000000']);

  const [{ data: rows }, { data: mekanik }] = await Promise.all([
    query,
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = { mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })) };
  const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;

  return (
    <div>
      {canManage && (
        <PeriodResetButton
          table="gaji"
          column="mekanik_id"
          ids={mekanikIds || []}
          allRows={perm.isSuperAdmin && ids.length === 0}
          label="List Gaji"
        />
      )}
      <CrudTable table="gaji" label="List Gaji" fields={FIELDS} rows={rows || []} relations={relations} canManage={canManage} />
    </div>
  );
}
