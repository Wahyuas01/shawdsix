import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'badside_id', label: 'Badside', type: 'relation', rel: 'badside' },
  { name: 'anggota_id', label: 'Anggota', type: 'relation', rel: 'anggota' },
  { name: 'tanggal', label: 'Tanggal', type: 'date' },
  { name: 'ikan', label: 'Ikan', type: 'number' },
  { name: 'komponen', label: 'Komponen', type: 'number' },
  { name: 'material', label: 'Material', type: 'number' },
  { name: 'uang', label: 'Uang (Rp)', type: 'number' },
  { name: 'marjun', label: 'Marjun', type: 'number' },
  { name: 'catatan', label: 'Catatan', type: 'textarea' },
];

export default async function Page() {
  const supabase = createClient();
  const [{ data: rows }, { data: badside }, { data: anggota }] = await Promise.all([
    supabase.from('setoran_badside').select('*').order('tanggal', { ascending: false }),
    supabase.from('badside').select('id, nama'),
    supabase.from('anggota_badside').select('id, nama'),
  ]);
  const relations = {
    badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })),
    anggota: (anggota || []).map((a) => ({ id: a.id, label: a.nama })),
  };
  return <CrudTable table="setoran_badside" label="Setoran Anggota" fields={FIELDS} rows={rows || []} relations={relations} />;
}
