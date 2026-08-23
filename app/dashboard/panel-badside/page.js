import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SetoranBadsideForm from '@/components/SetoranBadsideForm';

export default async function PanelBadsidePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: anggota } = await supabase.from('anggota_badside').select('*, badside(*)').eq('profile_id', user.id).maybeSingle();
  if (!anggota) redirect('/dashboard');

  const [{ data: gudang }, { data: setoranSaya }, { data: log }] = await Promise.all([
    supabase.from('gudang_badside').select('*').eq('badside_id', anggota.badside_id).maybeSingle(),
    supabase.from('setoran_badside').select('*').eq('anggota_id', anggota.id).order('tanggal', { ascending: false }),
    supabase.from('log_anggota_badside').select('*').eq('badside_id', anggota.badside_id).order('tanggal', { ascending: false }).limit(10),
  ]);

  const Stat = ({ label, value }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-navy-950 mt-1">{value ?? 0}</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">{anggota.badside?.nama}</h1>
        <p className="text-sm text-slate-500">Panel anggota — {anggota.jabatan} · {anggota.nama}</p>
      </div>

      <div>
        <h2 className="font-bold text-navy-950 mb-2 text-sm">Gudang Badside</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Ikan" value={gudang?.ikan} />
          <Stat label="Komponen" value={gudang?.komponen} />
          <Stat label="Material" value={gudang?.material} />
          <Stat label="Uang" value={gudang?.uang ? `Rp ${Number(gudang.uang).toLocaleString('id-ID')}` : 0} />
          <Stat label="Marjun" value={gudang?.marjun} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-bold text-navy-950 mb-3 text-sm">Setor Sekarang</h2>
        <SetoranBadsideForm badsideId={anggota.badside_id} anggotaId={anggota.id} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Riwayat Setoran Saya</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(setoranSaya || []).map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 text-slate-500">{s.tanggal}</td>
                <td className="px-5 py-3">Ikan {s.ikan} · Komponen {s.komponen} · Material {s.material} · Rp {Number(s.uang).toLocaleString('id-ID')} · Marjun {s.marjun}</td>
              </tr>
            ))}
            {!setoranSaya?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum pernah setor.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Log Badside Terbaru</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(log || []).map((l) => (
              <tr key={l.id}>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{l.tanggal}</td>
                <td className="px-5 py-3">{l.tipe} — {l.anggota_nama}</td>
              </tr>
            ))}
            {!log?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum ada log.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
