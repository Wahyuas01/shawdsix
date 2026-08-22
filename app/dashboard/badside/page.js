import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Badside', type: 'text' },
  { name: 'leader', label: 'Leader', type: 'text' },
  { name: 'deskripsi', label: 'Deskripsi', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function BadsidePage() {
  const supabase = createClient();
  const { data: rows } = await supabase.from('badside').select('*').order('created_at', { ascending: false });

  return <CrudTable table="badside" label="Badside" fields={FIELDS} rows={rows || []} />;
}
