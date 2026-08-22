import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'periode', label: 'Periode', type: 'text' },
  { name: 'total_setoran', label: 'Total Setoran (Rp)', type: 'number' },
  { name: 'total_pengeluaran', label: 'Total Pengeluaran (Rp)', type: 'number' },
  { name: 'ringkasan', label: 'Ringkasan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('report_mingguan').select('*').order('created_at', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="report_mingguan" label="Report Mingguan" fields={FIELDS} rows={rows || []} relations={relations} />;
}
