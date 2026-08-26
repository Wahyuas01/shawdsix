'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetKomponenButton({ workshopId, hasExistingPeriod }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function reset() {
    if (!confirm('Tutup periode ini buat report mingguan? Data "Komponen Masuk" minggu ini akan dihapus permanen, dan log komponen mulai kosong lagi buat periode berikutnya. Setoran Modif tetap aman, cuma nggak dihitung lagi di ringkasan periode baru.')) return;
    setLoading(true);
    setError(null);

    // Data "masuk" (Data Komponen) memang murni buat log mingguan ini,
    // jadi aman dihapus beneran sesuai permintaan.
    const { error: delErr } = await supabase.from('komponen_tracking').delete().eq('workshop_id', workshopId);
    if (delErr) {
      setLoading(false);
      setError(delErr.message);
      return;
    }

    // Setoran Modif TIDAK dihapus (itu catatan finansial/hasil kerja mekanik).
    // Cukup majukan penanda periode supaya "keluar" di ringkasan mulai
    // dihitung dari sekarang lagi.
    const periodResult = hasExistingPeriod
      ? await supabase.from('komponen_period').update({ reset_at: new Date().toISOString() }).eq('workshop_id', workshopId)
      : await supabase.from('komponen_period').insert({ workshop_id: workshopId, reset_at: new Date().toISOString() });

    setLoading(false);
    if (periodResult.error) {
      setError(periodResult.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={reset}
        disabled={loading}
        className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60 border border-red-200 rounded-lg px-3 py-1.5"
      >
        {loading ? 'Memproses...' : 'Tutup Periode & Reset'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 max-w-[200px] text-right">{error}</p>}
    </div>
  );
}
