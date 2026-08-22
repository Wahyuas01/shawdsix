'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Komponen CRUD generik. Pakai ini sebagai pola untuk semua modul lain
 * (anggota-badside, gudang-badside, workshop, mekanik, dst) — tinggal
 * ganti props `table` dan `fields` sesuai kolom di supabase/schema.sql.
 *
 * fields: [{ name, label, type: 'text'|'number'|'date'|'select', options? }]
 */
export default function CrudTable({ table, label, fields, rows }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  function openForm(row = null) {
    setEditing(row);
    setForm(row || {});
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    if (editing) {
      await supabase.from(table).update(form).eq('id', editing.id);
    } else {
      await supabase.from(table).insert(form);
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(id) {
    if (!confirm('Hapus data ini?')) return;
    await supabase.from(table).delete().eq('id', id);
    router.refresh();
  }

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

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              {fields.slice(0, 5).map((f) => (
                <th key={f.name} className="px-4 py-3">{f.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                {fields.slice(0, 5).map((f) => (
                  <td key={f.name} className="px-4 py-3">{String(r[f.name] ?? '—')}</td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openForm(r)} className="text-brandblue-600 text-xs font-semibold mr-3">Edit</button>
                  <button onClick={() => remove(r.id)} className="text-red-500 text-xs font-semibold">Hapus</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={fields.length + 1} className="text-center py-10 text-slate-400">Belum ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-navy-950">{editing ? 'Edit' : 'Tambah'} {label}</h3>
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">— Pilih —</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
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
