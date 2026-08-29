'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LamaranForm({ workshops, userId }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    ucp: '', nama_ic: '', umur_ic: '', umur_ooc: '', family: '', workshop_id: '',
  });
  const [foto, setFoto] = useState({ foto_ucp_family_url: '', foto_stat_warning_url: '', foto_umur_url: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleFile(e, name) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `lamaran_mekanik/${Date.now()}-${file.name}`;
    const { error: err } = await supabase.storage.from('setoran-modif').upload(path, file);
    if (!err) {
      const { data } = supabase.storage.from('setoran-modif').getPublicUrl(path);
      setFoto((f) => ({ ...f, [name]: data.publicUrl }));
    } else {
      setError('Gagal upload gambar: ' + err.message);
    }
    setUploading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('lamaran_mekanik').insert({
      profile_id: userId,
      workshop_id: form.workshop_id || null,
      ucp: form.ucp,
      nama_ic: form.nama_ic,
      umur_ic: form.umur_ic,
      umur_ooc: form.umur_ooc,
      family: form.family,
      ...foto,
      status: 'Pending',
      tanggal: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    if (err) {
      // Bisa ketolak dari 2 lapis: RLS (pesan soal row-level security) atau
      // unique index (kode 23505) — dua-duanya berarti hal yang sama: masih
      // ada lamaran Pending yang belum direspon admin.
      if (err.code === '23505' || /row-level security|policy/i.test(err.message)) {
        setError('Kamu masih punya lamaran yang belum direspon admin. Tunggu diproses dulu sebelum kirim lamaran baru.');
      } else {
        setError(err.message);
      }
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="bg-emerald-50 text-emerald-700 text-sm rounded-lg px-4 py-3">
        Lamaran kamu sudah terkirim, tinggal tunggu diproses admin workshop.
      </div>
    );
  }

  const field = (name, label, opts = {}) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        required={opts.required !== false}
        placeholder={opts.placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </div>
  );

  const fileField = (name, label) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input type="file" accept="image/*" onChange={(e) => handleFile(e, name)} className="text-sm" required={!foto[name]} />
      {foto[name] && <img src={foto[name]} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      {workshops.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Workshop Tujuan</label>
          <select
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.workshop_id}
            onChange={(e) => setForm({ ...form, workshop_id: e.target.value })}
          >
            <option value="">— Pilih Workshop —</option>
            {workshops.map((w) => <option key={w.id} value={w.id}>{w.nama}</option>)}
          </select>
        </div>
      )}
      {field('ucp', 'UCP')}
      <div className="grid sm:grid-cols-2 gap-3">
        {field('nama_ic', 'Nama IC')}
        {field('umur_ic', 'Umur IC')}
      </div>
      {field('umur_ooc', 'Umur OOC')}
      {field('family', 'Family', { placeholder: 'Kalau tidak ada, tulis "Tidak ada"' })}

      {fileField('foto_ucp_family_url', 'Screenshot UCP Kelihatan Family')}
      {fileField('foto_stat_warning_url', 'Screenshot Stat Warning')}
      {fileField('foto_umur_url', 'Screenshot Umur')}

      {uploading && <p className="text-xs text-slate-400">Mengunggah gambar...</p>}
      <button disabled={saving || uploading} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Mengirim...' : 'Kirim Lamaran'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
