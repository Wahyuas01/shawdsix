import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import SetoranModifForm from '@/components/SetoranModifForm';
import DutyForm from '@/components/DutyForm';

export default async function PanelWorkshopPage() {
  const supabase = createClient();
  const user = await getCachedUser();

  const { data: mekanik } = await supabase.from('mekanik').select('*, workshop(*)').eq('profile_id', user.id).maybeSingle();
  if (!mekanik) redirect('/dashboard');

  const [{ data: setoranSaya }, { data: gajiSaya }, { data: dutySaya }] = await Promise.all([
    supabase.from('setoran_modif').select('*').eq('mekanik_id', mekanik.id).order('tanggal', { ascending: false }),
    supabase.from('gaji').select('*').eq('mekanik_id', mekanik.id).order('created_at', { ascending: false }),
    supabase.from('duty_mekanik').select('*').eq('mekanik_id', mekanik.id).order('tanggal', { ascending: false }).limit(15),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">{mekanik.workshop?.nama}</h1>
        <p className="text-sm text-slate-500">Panel mekanik — {mekanik.jabatan} · {mekanik.nama}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-bold text-navy-950 mb-3 text-sm">Lapor Duty</h2>
        <DutyForm workshopId={mekanik.workshop_id} mekanikId={mekanik.id} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Laporan Duty Saya</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(dutySaya || []).map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{d.tanggal}</td>
                <td className="px-5 py-3">
                  {d.jam_mulai || '—'} - {d.jam_selesai || '—'}
                  {d.catatan ? ` — ${d.catatan}` : ''}
                </td>
              </tr>
            ))}
            {!dutySaya?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum ada laporan duty.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-bold text-navy-950 mb-3 text-sm">Setor Hasil Modif</h2>
        <SetoranModifForm workshopId={mekanik.workshop_id} mekanikId={mekanik.id} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Riwayat Setoran Modif Saya</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(setoranSaya || []).map((s) => (
              <tr key={s.id}>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{s.tanggal}</td>
                <td className="px-5 py-3">
                  Rp {Number(s.jumlah).toLocaleString('id-ID')} · Kompo keluar {s.komponen_keluar ?? 0} · Sisa kompo {s.sisa_komponen ?? 0}
                  {s.catatan ? ` — ${s.catatan}` : ''}
                </td>
              </tr>
            ))}
            {!setoranSaya?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum pernah setor.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Gaji Saya</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(gajiSaya || []).map((g) => (
              <tr key={g.id}>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{g.periode}</td>
                <td className="px-5 py-3">Rp {Number(g.jumlah).toLocaleString('id-ID')}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${g.status === 'Sudah Dibayar' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{g.status}</span>
                </td>
              </tr>
            ))}
            {!gajiSaya?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum ada data gaji.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
