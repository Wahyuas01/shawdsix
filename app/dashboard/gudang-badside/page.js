import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'ikan', label: 'Ikan', type: 'number' },
  { name: 'komponen', label: 'Komponen', type: 'number' },
  { name: 'material', label: 'Material', type: 'number' },
  { name: 'uang', label: 'Uang (Rp)', type: 'number' },
  { name: 'marjun', label: 'Marjun', type: 'number' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: badside }] = await Promise.all([
    supabase.from('gudang_badside').select('*').order('updated_at', { ascending: false }),
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  return <CrudTable table="gudang_badside" label="Gudang Badside" fields={FIELDS} rows={rows || []} relations={relations} />;
}
