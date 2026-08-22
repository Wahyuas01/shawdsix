import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'nama', label: 'Nama Anggota', type: 'text' },
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'jabatan', label: 'Jabatan', type: 'select', options: ['Leader', 'Wakil', 'Senior', 'Anggota'] },
  { name: 'join_date', label: 'Tanggal Gabung', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: badside }] = await Promise.all([
    supabase.from('anggota_badside').select('*').order('created_at', { ascending: false }),
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  return <CrudTable table="anggota_badside" label="Anggota Badside" fields={FIELDS} rows={rows || []} relations={relations} />;
}
