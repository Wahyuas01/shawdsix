import CrudTable from '@/components/CrudTable';

export default function AnggotaBadsidePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Anggota Badside</h1>
      <CrudTable
        tableName="anggota_badside"
        columns={[
          { key: 'nama', label: 'Nama', type: 'text' },
          { key: 'badside_id', label: 'Badside ID', type: 'text' },
          { key: 'jabatan', label: 'Jabatan', type: 'text' },
          { key: 'join_date', label: 'Tanggal Join', type: 'date' },
          { key: 'status', label: 'Status', type: 'text' }
        ]}
      />
    </div>
  );
}