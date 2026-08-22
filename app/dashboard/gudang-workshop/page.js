import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'komponen', label: 'Nama Komponen', type: 'text' },
  { name: 'stok', label: 'Stok', type: 'number' },
  { name: 'uang', label: 'Kas Workshop (Rp)', type: 'number' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('gudang_workshop').select('*').order('updated_at', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="gudang_workshop" label="Gudang Workshop" fields={FIELDS} rows={rows || []} relations={relations} />;
}
