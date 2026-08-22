import { createClient } from '@/lib/supabase/server';
import CrudTable from '@/components/CrudTable';

export default async function AnggotaBadsidePage() {
  const supabase = createClient();
  
  // 1. Ambil data anggota badside (untuk ditampilkan di tabel)
  const { data: rows } = await supabase
    .from('anggota_badside')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Ambil data dari tabel badside untuk dijadikan dropdown
  const { data: badsideList } = await supabase
    .from('badside')
    .select('id, nama');

  // 3. Mapping data badside menjadi format opsi { label, value }
  const badsideOptions = badsideList?.map((item) => ({
    label: item.nama, // Yang dilihat user
    value: item.id    // UUID yang dikirim ke database
  })) || [];

  // 4. Masukkan ke konfigurasi FIELDS
  const FIELDS = [
    { name: 'nama', label: 'Nama Anggota', type: 'text' },
    { 
      name: 'badside_id', 
      label: 'Kelompok (Badside)', 
      type: 'select', 
      options: badsideOptions // Panggil opsi di sini
    },
    { name: 'jabatan', label: 'Jabatan', type: 'text' },
    { name: 'join_date', label: 'Tanggal Join', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
  ];

  return <CrudTable table="anggota_badside" label="Anggota Badside" fields={FIELDS} rows={rows || []} />;
}
