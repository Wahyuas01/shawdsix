import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import HomeCta from '@/components/HomeCta';

export default async function HomePage() {
  const supabase = createClient();
  const [user, { count: workshopCount }, { count: mekanikCount }, { data: setoranAll }] = await Promise.all([
    getCachedUser(),
    supabase.from('workshop').select('*', { count: 'exact', head: true }),
    supabase.from('mekanik').select('*', { count: 'exact', head: true }),
    supabase.from('setoran_modif').select('jumlah, mekanik_id, mekanik(nama)'),
  ]);

  const totalSetoran = (setoranAll || []).reduce((s, r) => s + (Number(r.jumlah) || 0), 0);

  const totalsByMekanik = {};
  for (const s of setoranAll || []) {
    if (!s.mekanik_id) continue;
    if (!totalsByMekanik[s.mekanik_id]) totalsByMekanik[s.mekanik_id] = { nama: s.mekanik?.nama || 'Mekanik', total: 0, jumlahSetoran: 0 };
    totalsByMekanik[s.mekanik_id].total += Number(s.jumlah) || 0;
    totalsByMekanik[s.mekanik_id].jumlahSetoran += 1;
  }
  const leaderboard = Object.values(totalsByMekanik).sort((a, b) => b.total - a.total).slice(0, 5);

  const stats = [
    { n: workshopCount || 0, label: 'Workshop' },
    { n: mekanikCount || 0, label: 'Mekanik' },
    { n: 'Rp ' + totalSetoran.toLocaleString('id-ID'), label: 'Total Setoran' },
  ];

  const medalColor = ['bg-amber-100 text-amber-700', 'bg-slate-200 text-slate-600', 'bg-orange-100 text-orange-700'];

  return (
    <main>
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-brandblue-700 px-4 sm:px-6 md:px-16 py-16 sm:py-20 md:py-28 text-center text-white">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-xl mb-6">
          SD
        </div>
        <h1 className="font-extrabold text-2xl sm:text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
          Satu Portal untuk Komunitas Workshop Shaw D&apos;SIX
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto mt-4 text-sm md:text-base">
          Kelola workshop, gudang komponen, dan mekanik dalam satu tempat — transparan dan mudah diakses seluruh anggota.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <HomeCta loggedIn={!!user} />
          <a href="https://discord.gg/your-invite" className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold border border-white/20 hover:bg-white/10">
            Join Discord
          </a>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto mt-12 sm:mt-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg sm:text-2xl md:text-4xl font-extrabold break-words">{s.n}</div>
              <div className="text-[11px] sm:text-xs md:text-sm text-blue-100 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-16 py-12 sm:py-16 max-w-2xl mx-auto">
        <h2 className="font-extrabold text-xl sm:text-2xl text-navy-950 text-center mb-1">Leaderboard Setoran Terbanyak</h2>
        <p className="text-xs sm:text-sm text-slate-500 text-center mb-6">Mekanik dengan total setoran modif tertinggi</p>

        {leaderboard.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">Belum ada data setoran.</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {leaderboard.map((m, i) => (
              <div key={m.nama + i} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-extrabold text-sm ${medalColor[i] || 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-navy-950 text-sm truncate">{m.nama}</div>
                  <div className="text-xs text-slate-500">{m.jumlahSetoran}x setoran</div>
                </div>
                <div className="font-extrabold text-brandblue-600 text-sm sm:text-base whitespace-nowrap">
                  Rp {m.total.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
