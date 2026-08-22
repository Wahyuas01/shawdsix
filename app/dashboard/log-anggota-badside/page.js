import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'anggota_nama', label: 'Nama Anggota', type: 'text' },
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'tipe', label: 'Tipe', type: 'select', options: ['Masuk', 'Keluar', 'Dikeluarkan', 'Warning'] },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: badside }] = await Promise.all([
    supabase.from('log_anggota_badside').select('*').order('tanggal', { ascending: false }),
    supabase.from('badside').select('id, nama'),
  ]);
  const relations = { badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })) };
  return <CrudTable table="log_anggota_badside" label="Log Anggota Badside" fields={FIELDS} rows={rows || []} relations={relations} />;
}
