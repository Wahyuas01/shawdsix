import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Anggota', type: 'text' },
  { name: 'badside_id', label: 'Badside ID', type: 'text' },
  { name: 'jabatan', label: 'Jabatan', type: 'text' },
  { name: 'join_date', label: 'Tanggal Join', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function AnggotaBadsidePage() {
  const supabase = createClient();
  const { data: rows } = await supabase.from('anggota_badside').select('*').order('created_at', { ascending: false });

  return <CrudTable table="anggota_badside" label="Anggota Badside" fields={FIELDS} rows={rows || []} />;
}
