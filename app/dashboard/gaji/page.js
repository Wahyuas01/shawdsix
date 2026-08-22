import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'periode', label: 'Periode', type: 'text' },
  { name: 'jumlah', label: 'Jumlah (Rp)', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: ['Belum Dibayar', 'Sudah Dibayar'] },
  { name: 'tanggal_bayar', label: 'Tanggal Bayar', type: 'date' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: mekanik }] = await Promise.all([
    supabase.from('gaji').select('*').order('created_at', { ascending: false }),
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = { mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })) };
  return <CrudTable table="gaji" label="List Gaji" fields={FIELDS} rows={rows || []} relations={relations} />;
}
