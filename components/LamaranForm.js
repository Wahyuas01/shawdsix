'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LamaranForm({ workshops, defaultNama }) {
  const supabase = createClient();
  const router = useRouter();
  const [nama, setNama] = useState(defaultNama || '');
  const [workshopId, setWorkshopId] = useState('');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('lamaran_mekanik').insert({
      nama,
      workshop_id: workshopId || null,
      tanggal: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      catatan,
    });
    setSaving(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="bg-emerald-50 text-emerald-700 text-sm rounded-lg px-4 py-3">
        Lamaran kamu sudah terkirim, tinggal tunggu diproses admin workshop.
        <button onClick={() => setDone(false)} className="block mt-2 text-xs font-semibold underline">Kirim lamaran lain</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kamu</label>
        <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Workshop Tujuan</label>
        <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}>
          <option value="">— Pilih Workshop —</option>
          {workshops.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Kenapa Kamu Cocok Jadi Mekanik? (opsional)</label>
        <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </div>
      <button disabled={saving} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Mengirim...' : 'Kirim Lamaran'}
      </button>
    </form>
  );
}
