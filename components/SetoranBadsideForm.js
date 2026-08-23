'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SetoranBadsideForm({ badsideId, anggotaId }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ ikan: 0, komponen: 0, material: 0, uang: 0, marjun: 0, catatan: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('setoran_badside').insert({
      badside_id: badsideId,
      anggota_id: anggotaId,
      tanggal: new Date().toISOString().slice(0, 10),
      ...form,
    });
    setSaving(false);
    setForm({ ikan: 0, komponen: 0, material: 0, uang: 0, marjun: 0, catatan: '' });
    router.refresh();
  }

  const num = (name) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{name}</label>
      <input
        type="number"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {num('ikan')}{num('komponen')}{num('material')}{num('uang')}{num('marjun')}
      </div>
      <input
        placeholder="Catatan (opsional)"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        value={form.catatan}
        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
      />
      <button disabled={saving} className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
        {saving ? 'Menyimpan...' : 'Kirim Setoran'}
      </button>
    </form>
  );
}
