import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'workshop_id', label: 'Workshop', type: 'relation', rel: 'workshop' },
  { name: 'mekanik_id', label: 'Mekanik', type: 'relation', rel: 'mekanik' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'jumlah', label: 'Jumlah Setoran (Rp)', type: 'number' },
  { name: 'foto_sebelum_url', label: 'Screenshot Sebelum', type: 'file' },
  { name: 'foto_sesudah_url', label: 'Screenshot Sesudah', type: 'file' },
  { name: 'catatan', label: 'Catatan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: workshop }, { data: mekanik }] = await Promise.all([
    supabase.from('setoran_modif').select('*').order('tanggal', { ascending: false }),
    supabase.from('workshop').select('id, nama'),
    supabase.from('mekanik').select('id, nama'),
  ]);
  const relations = {
    workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })),
    mekanik: (mekanik || []).map((m) => ({ id: m.id, label: m.nama })),
  };
  return <CrudTable table="setoran_modif" label="Setoran Modif" fields={FIELDS} rows={rows || []} relations={relations} />;
}
