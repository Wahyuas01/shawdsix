import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Workshop', type: 'text' },
  { name: 'lokasi', label: 'Lokasi', type: 'text' },
  { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const { data: rows } = await supabase.from('workshop').select('*').order('created_at', { ascending: false });
  return <CrudTable table="workshop" label="Workshop" fields={FIELDS} rows={rows || []} />;
}
