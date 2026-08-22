'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Komponen CRUD generik dipakai semua modul.
 *
 * fields: [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea'|'relation'|'file', options?, rel? }]
 *   - type 'relation': butuh field.rel = key di prop `relations` (array of {id,label})
 *   - type 'file': upload ke supabase storage bucket 'setoran-modif', field diisi public URL
 * relations: { [relKey]: [{ id, label }] } — daftar opsi untuk dropdown relasi
 */
export default function CrudTable({ table, label, fields, rows, relations = {} }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  function openForm(row = null) {
    setEditing(row);
    setForm(row || {});
    setOpen(true);
  }

  function relLabel(relKey, id) {
    const opt = (relations[relKey] || []).find((o) => o.id === id);
    return opt ? opt.label : '—';
  }

  async function handleFile(e, name) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${table}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('setoran-modif').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('setoran-modif').getPublicUrl(path);
      setForm((f) => ({ ...f, [name]: data.publicUrl }));
    }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form };
    delete payload.id;
    if (editing) {
      await supabase.from(table).update(payload).eq('id', editing.id);
    } else {
      await supabase.from(table).insert(payload);
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(id) {
    if (!confirm('Hapus data ini?')) return;
    await supabase.from(table).delete().eq('id', id);
    router.refresh();
  }

  const displayFields = fields.filter((f) => f.type !== 'textarea' && f.type !== 'file').slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-extrabold text-xl text-navy-950">{label}</h1>
          <p className="text-sm text-slate-500">{rows.length} data tercatat</p>
        </div>
        <button onClick={() => openForm()} className="bg-brandblue-600 hover:bg-brandblue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Tambah {label}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              {displayFields.map((f) => (
                <th key={f.name} className="px-4 py-3 whitespace-nowrap">{f.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                {displayFields.map((f) => (
                  <td key={f.name} className="px-4 py-3 whitespace-nowrap">
                    {f.type === 'relation' ? relLabel(f.rel, r[f.name]) : String(r[f.name] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => openForm(r)} className="text-brandblue-600 text-xs font-semibold mr-3">Edit</button>
                  <button onClick={() => remove(r.id)} className="text-red-500 text-xs font-semibold">Hapus</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={displayFields.length + 1} className="text-center py-10 text-slate-400">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 my-8">
            <h3 className="font-bold text-navy-950">{editing ? 'Edit' : 'Tambah'} {label}</h3>
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                {f.type === 'select' && (
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">— Pilih —</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {f.type === 'relation' && (
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">— Pilih —</option>
                    {(relations[f.rel] || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                )}
                {f.type === 'textarea' && (
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
                {f.type === 'file' && (
                  <div>
                    <input type="file" accept="image/*" onChange={(e) => handleFile(e, f.name)} className="text-sm" />
                    {uploading && <p className="text-xs text-slate-400 mt-1">Mengunggah...</p>}
                    {form[f.name] && <img src={form[f.name]} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
                  </div>
                )}
                {!['select', 'relation', 'textarea', 'file'].includes(f.type) && (
                  <input
                    type={f.type}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300">Batal</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brandblue-600 text-white">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
