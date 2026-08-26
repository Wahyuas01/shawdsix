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
  const [onDuty, setOnDuty] = useState('');
  const [offDuty, setOffDuty] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `duty_mekanik/${Date.now()}-${file.name}`;
    const { error: err } = await supabase.storage.from('setoran-modif').upload(path, file);
    if (!err) {
      const { data } = supabase.storage.from('setoran-modif').getPublicUrl(path);
      setter(data.publicUrl);
    } else {
      setError('Gagal upload gambar: ' + err.message);
    }
    setUploading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('duty_mekanik').insert({
      workshop_id: workshopId,
      mekanik_id: mekanikId,
      tanggal: new Date().toISOString().slice(0, 10),
      jam_mulai: jamMulai || null,
      jam_selesai: jamSelesai || null,
      catatan,
      foto_on_duty_url: onDuty || null,
      foto_off_duty_url: offDuty || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setJamMulai(''); setJamSelesai(''); setCatatan(''); setOnDuty(''); setOffDuty('');
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
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Screenshot On Duty</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, setOnDuty)} className="text-sm" />
          {onDuty && <img src={onDuty} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Screenshot Off Duty</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, setOffDuty)} className="text-sm" />
          {offDuty && <img src={offDuty} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
        </div>
      </div>
      {uploading && <p className="text-xs text-slate-400">Mengunggah gambar...</p>}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Duty</label>
        <input
          placeholder="cth. jaga workshop, bantu 3 modifikasi"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>
      <button disabled={saving || uploading} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Menyimpan...' : 'Lapor Duty'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
