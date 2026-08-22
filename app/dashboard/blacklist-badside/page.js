import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama', type: 'text' },
  { name: 'alasan', label: 'Alasan', type: 'textarea' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'oleh', label: 'Dilaporkan Oleh', type: 'text' },
];

export default async function Page() {
  const supabase = createClient();
  const { data: rows } = await supabase.from('blacklist_badside').select('*').order('tanggal', { ascending: false });
  return <CrudTable table="blacklist_badside" label="Blacklist Badside" fields={FIELDS} rows={rows || []} />;
}
