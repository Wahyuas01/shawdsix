import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'mekanik_nama', label: 'Nama Mekanik', type: 'text' },
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'tipe', label: 'Tipe', type: 'select', options: ['Masuk', 'Keluar', 'Naik Jabatan', 'Blacklist', 'Warning'] },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'keterangan', label: 'Keterangan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }] = await Promise.all([
    supabase.from('logs_workshop').select('*').order('tanggal', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
  ]);
  const relations = { workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })) };
  return <CrudTable table="logs_workshop" label="Log Anggota Workshop" fields={FIELDS} rows={rows || []} relations={relations} />;
}
