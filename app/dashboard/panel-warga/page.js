import { createClient } from '@/lib/supabase/server';
import LamaranForm from '@/components/LamaranForm';

export default async function PanelWargaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: mekanikList }, { data: workshops }, { data: logs }] = await Promise.all([
    supabase.from('profiles').select('discord_username').eq('id', user.id).single(),
    supabase.from('mekanik').select('*, workshop(nama)').order('created_at', { ascending: false }),
    supabase.from('workshop').select('id, nama').eq('status', 'Aktif'),
    supabase
      .from('logs_workshop')
      .select('*, workshop(nama)')
      .in('tipe', ['Masuk', 'Keluar', 'Warning'])
      .order('tanggal', { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">Panel Warga</h1>
        <p className="text-sm text-slate-500">Lihat daftar mekanik, ajukan lamaran, dan pantau log keanggotaan workshop.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Daftar Mekanik</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
              <th className="px-5 py-2">Nama</th>
              <th className="px-5 py-2">Workshop</th>
              <th className="px-5 py-2">Jabatan</th>
              <th className="px-5 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(mekanikList || []).map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3">{m.nama}</td>
                <td className="px-5 py-3">{m.workshop?.nama || '—'}</td>
                <td className="px-5 py-3">{m.jabatan || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span>
                </td>
              </tr>
            ))}
            {!mekanikList?.length && <tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada mekanik terdaftar.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-bold text-navy-950 mb-1 text-sm">Mau Jadi Mekanik?</h2>
        <p className="text-xs text-slate-500 mb-3">Isi form ini buat ajukan lamaran ke workshop yang kamu mau.</p>
        <LamaranForm workshops={workshops || []} defaultNama={profile?.discord_username} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 font-bold text-navy-950 text-sm">Log Keluar / Masuk / Warning Mekanik</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {(logs || []).map((l) => (
              <tr key={l.id}>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{l.tanggal}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                    l.tipe === 'Warning' ? 'bg-amber-50 text-amber-600' : l.tipe === 'Keluar' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>{l.tipe}</span>
                  {l.mekanik_nama} — {l.workshop?.nama}
                  {l.keterangan ? <span className="text-slate-400"> · {l.keterangan}</span> : null}
                </td>
              </tr>
            ))}
            {!logs?.length && <tr><td className="px-5 py-6 text-center text-slate-400">Belum ada log.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
