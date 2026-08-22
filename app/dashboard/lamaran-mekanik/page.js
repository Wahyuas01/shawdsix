import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Pelamar', type: 'text' },
  { name: 'workshop_id', label: 'Workshop Tujuan', type: 'relation', rel: 'workshop' },
  { name: 'tanggal', label: 'Tanggal Lamar', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Diterima', 'Ditolak'] },
  { name: 'catatan', label: 'Catatan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('lamaran_mekanik').select('*').order('tanggal', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="lamaran_mekanik" label="Lamaran Mekanik" fields={FIELDS} rows={rows || []} relations={relations} />;
}
