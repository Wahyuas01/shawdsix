'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SetoranModifForm({ workshopId, mekanikId }) {
  const supabase = createClient();
  const router = useRouter();
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');
  const [sebelum, setSebelum] = useState('');
  const [sesudah, setSesudah] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function upload(file) {
    const path = `setoran_modif/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('setoran-modif').upload(path, file);
    if (error) return null;
    return supabase.storage.from('setoran-modif').getPublicUrl(path).data.publicUrl;
  }

  async function handleFile(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    if (url) setter(url);
    setUploading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('setoran_modif').insert({
      workshop_id: workshopId,
      mekanik_id: mekanikId,
      tanggal: new Date().toISOString().slice(0, 10),
      jumlah: jumlah || 0,
      catatan,
      foto_sebelum_url: sebelum,
      foto_sesudah_url: sesudah,
    });
    setSaving(false);
    setJumlah(''); setCatatan(''); setSebelum(''); setSesudah('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Setoran (Rp)</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={jumlah} onChange={(e) => setJumlah(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan</label>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Screenshot Sebelum</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, setSebelum)} className="text-sm" />
          {sebelum && <img src={sebelum} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Screenshot Sesudah</label>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e, setSesudah)} className="text-sm" />
          {sesudah && <img src={sesudah} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
        </div>
      </div>
      {uploading && <p className="text-xs text-slate-400">Mengunggah gambar...</p>}
      <button disabled={saving} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Menyimpan...' : 'Kirim Setoran'}
      </button>
    </form>
  );
}
