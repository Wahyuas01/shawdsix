import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'tipe', label: 'Tipe', type: 'select', options: ['Masuk', 'Keluar'] },
  { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number' },
  { name: 'keterangan', label: 'Keterangan', type: 'text' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('keuangan_workshop').select('*').order('tanggal', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="keuangan_workshop" label="Data Uang Workshop" fields={FIELDS} rows={rows || []} relations={relations} />;
}
