'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Tombol "Tutup Periode & Reset" generik. Menghapus SEMUA baris di `table`
 * yang cocok `column IN (ids)` — atau semua baris kalau `allRows` true
 * (dipakai buat Super Admin yang nggak terikat workshop tertentu).
 *
 * Dipakai di halaman: Setoran Modif, Log Duty Mekanik, Data Komponen, List Gaji.
 */
export default function PeriodResetButton({ table, column, ids = [], allRows = false, label }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function reset() {
    if (!confirm(`Tutup periode "${label}"? Semua data yang ada sekarang akan DIHAPUS PERMANEN, dan mulai kosong lagi buat periode berikutnya. Pastikan sudah dicatat/di-screenshot dulu buat report.`)) return;
    setLoading(true);
    setError(null);

    let query = supabase.from(table).delete();
    query = allRows ? query.not('id', 'is', null) : query.in(column, ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const { error: err } = await query;

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-3">
      <button
        onClick={reset}
        disabled={loading}
        className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60 border border-red-200 rounded-lg px-3 py-1.5"
      >
        {loading ? 'Memproses...' : 'Tutup Periode & Reset'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}
