import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'dari_nama', label: 'Rating Dari (Customer)', type: 'text' },
  { name: 'rating', label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
  { name: 'komentar', label: 'Komentar', type: 'text' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: mekanik }] = await Promise.all([
    supabase.from('rating_mekanik').select('*').order('tanggal', { ascending: false }),
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = { mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })) };
  return <CrudTable table="rating_mekanik" label="Rating Mekanik" fields={FIELDS} rows={rows || []} relations={relations} />;
}
