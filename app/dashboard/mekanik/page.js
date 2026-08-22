import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Mekanik', type: 'text' },
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Kepala Workshop', 'Senior Mekanik', 'Mekanik', 'Trainee'] },
  { name: 'join_date', label: 'Tanggal Gabung', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('mekanik').select('*').order('created_at', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="mekanik" label="Anggota Mekanik" fields={FIELDS} rows={rows || []} relations={relations} />;
}
