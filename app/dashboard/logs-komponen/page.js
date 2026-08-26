import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import { getPermissions, visibleWorkshopIds } from '@/lib/permissions';
import ResetKomponenButton from '@/components/ResetKomponenButton';

export default async function LogsKomponenPage() {
  const supabase = createClient();
  const user = await getCachedUser();
  const perm = await getPermissions(supabase, user.id);
  const ids = visibleWorkshopIds(perm);
  const canManage = perm.isSuperAdmin || perm.adminWorkshopIds.length > 0;

  const { data: workshops } = perm.isSuperAdmin
    ? await supabase.from('workshop').select('id, nama')
    : await supabase.from('workshop').select('id, nama').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

  if (!workshops?.length) {
    return (
      <div>
        <h1 className="font-extrabold text-xl text-navy-950 mb-2">Logs Komponen</h1>
        <p className="text-sm text-slate-500">Belum ada workshop yang bisa kamu lihat logs-nya.</p>
      </div>
    );
  }

  const { data: periods } = await supabase.from('komponen_period').select('*').in('workshop_id', workshops.map((w) => w.id));
  const periodMap = Object.fromEntries((periods || []).map((p) => [p.workshop_id, p.reset_at]));

  const sections = await Promise.all(
    workshops.map(async (w) => {
      const resetAt = periodMap[w.id] || '1970-01-01T00:00:00Z';

      const [{ data: masuk }, { data: keluar }] = await Promise.all([
        supabase.from('komponen_tracking').select('*, mekanik(nama)').eq('workshop_id', w.id).gte('created_at', resetAt).order('tanggal', { ascending: false }),
        supabase.from('setoran_modif').select('*, mekanik(nama)').eq('workshop_id', w.id).gt('komponen_keluar', 0).gte('created_at', resetAt).order('tanggal', { ascending: false }),
      ]);

      const entries = [
        ...(masuk || []).map((m) => ({
          id: 'masuk-' + m.id,
          tanggal: m.tanggal,
          tipe: 'Masuk',
          jumlah: Number(m.jumlah_masuk) || 0,
          detail: `Komponen${m.mekanik?.nama ? ' — ke ' + m.mekanik.nama : ''}`,
        })),
        ...(keluar || []).map((s) => ({
          id: 'keluar-' + s.id,
          tanggal: s.tanggal,
          tipe: 'Keluar',
          jumlah: Number(s.komponen_keluar) || 0,
          detail: `Setoran modif — ${s.mekanik?.nama || 'Mekanik'}${s.catatan ? ' · ' + s.catatan : ''}`,
        })),
      ].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

      const totalMasuk = entries.filter((e) => e.tipe === 'Masuk').reduce((s, e) => s + e.jumlah, 0);
      const totalKeluar = entries.filter((e) => e.tipe === 'Keluar').reduce((s, e) => s + e.jumlah, 0);

      return { workshop: w, entries, totalMasuk, totalKeluar, hasExistingPeriod: !!periodMap[w.id] };
    })
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">Logs Komponen</h1>
        <p className="text-sm text-slate-500">Gabungan otomatis komponen masuk (Data Komponen) dan keluar (Setoran Modif).</p>
      </div>

      {sections.map(({ workshop, entries, totalMasuk, totalKeluar, hasExistingPeriod }) => (
        <div key={workshop.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-navy-950 text-sm">{workshop.nama}</span>
            {canManage && <ResetKomponenButton workshopId={workshop.id} hasExistingPeriod={hasExistingPeriod} />}
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{e.tanggal}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${e.tipe === 'Masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{e.tipe}</span>
                  </td>
                  <td className="px-5 py-3">{e.detail}</td>
                  <td className="px-5 py-3 text-right font-semibold">{e.jumlah}</td>
                </tr>
              ))}
              {!entries.length && <tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada data komponen periode ini.</td></tr>}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-navy-950">
                <td className="px-5 py-3" colSpan={2}>Total</td>
                <td className="px-5 py-3 text-right">Masuk {totalMasuk} · Keluar {totalKeluar}</td>
                <td className="px-5 py-3 text-right">Sisa {totalMasuk - totalKeluar}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      ))}
    </div>
  );
}
