import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import LamaranForm from '@/components/LamaranForm';

const STATUS_STYLE = {
  Pending: 'bg-amber-50 text-amber-600',
  Diterima: 'bg-emerald-50 text-emerald-600',
  Ditolak: 'bg-red-50 text-red-500',
};

export default async function PanelWargaPage() {
  const supabase = createClient();
  const user = await getCachedUser();

  const [{ data: mekanikList }, { data: workshops }, { data: lamaranSaya }] = await Promise.all([
    supabase.from('mekanik').select('*, workshop(nama)').order('created_at', { ascending: false }),
    supabase.from('workshop').select('id, nama').eq('status', 'Aktif'),
    supabase.from('lamaran_mekanik').select('*, workshop(nama)').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const sedangPending = lamaranSaya?.status === 'Pending';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">Panel Warga</h1>
        <p className="text-sm text-slate-500">Daftar mekanik yang aktif di komunitas Shaw D&apos;SIX.</p>
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

        {sedangPending ? (
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-2">
              Lamaran kamu ke <strong>{lamaranSaya.workshop?.nama || 'workshop'}</strong> masih diproses admin. Tunggu direspon dulu sebelum bisa apply lagi.
            </p>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE.Pending}`}>Pending</span>
          </div>
        ) : (
          <>
            {lamaranSaya?.status && (
              <p className="text-xs text-slate-500 mb-3">
                Lamaran kamu sebelumnya ke <strong>{lamaranSaya.workshop?.nama || 'workshop'}</strong> berstatus{' '}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[lamaranSaya.status]}`}>{lamaranSaya.status}</span>.
                {lamaranSaya.status === 'Ditolak' ? ' Kamu boleh coba apply lagi di bawah ini.' : ''}
              </p>
            )}
            <p className="text-xs text-slate-500 mb-3">Isi form ini lengkap dan jujur, admin bakal cek sebelum diproses.</p>
            <LamaranForm workshops={workshops || []} userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}
