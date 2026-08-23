'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DutyForm({ workshopId, mekanikId }) {
  const supabase = createClient();
  const router = useRouter();
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('duty_mekanik').insert({
      workshop_id: workshopId,
      mekanik_id: mekanikId,
      tanggal: new Date().toISOString().slice(0, 10),
      jam_mulai: jamMulai || null,
      jam_selesai: jamSelesai || null,
      catatan,
    });
    setSaving(false);
    setJamMulai(''); setJamSelesai(''); setCatatan('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Mulai Duty</label>
          <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Selesai Duty</label>
          <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Duty</label>
        <input
          placeholder="cth. jaga workshop, bantu 3 modifikasi"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>
      <button disabled={saving} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Menyimpan...' : 'Lapor Duty'}
      </button>
    </form>
  );
}
