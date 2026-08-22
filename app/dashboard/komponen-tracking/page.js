import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'komponen', label: 'Komponen', type: 'text' },
  { name: 'diberikan', label: 'Jumlah Diberikan', type: 'number' },
  { name: 'dipakai', label: 'Jumlah Dipakai', type: 'number' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }, { data: mekanik }] = await Promise.all([
    supabase.from('komponen_tracking').select('*').order('tanggal', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = {
    workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })),
    mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })),
  };
  return <CrudTable table="komponen_tracking" label="Data Komponen" fields={FIELDS} rows={rows || []} relations={relations} />;
}
