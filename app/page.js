import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = createClient();
  const [{ count: workshopCount }, { count: mekanikCount }] = await Promise.all([
    supabase.from('workshop').select('*', { count: 'exact', head: true }),
    supabase.from('mekanik').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { n: workshopCount || 0, label: 'Workshop' },
    { n: mekanikCount || 0, label: 'Mekanik' },
  ];

  return (
    <main>
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-brandblue-700 px-6 md:px-16 py-20 md:py-28 text-center text-white">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-xl mb-6">
          SD
        </div>
        <h1 className="font-extrabold text-3xl md:text-5xl leading-tight max-w-3xl mx-auto">
          Satu Portal untuk Komunitas Workshop Shaw D&apos;SIX
        </h1>
        <p className="text-blue-100 max-w-xl mx-auto mt-4 text-sm md:text-base">
          Kelola workshop, gudang komponen, dan mekanik dalam satu tempat — transparan dan mudah diakses seluruh anggota.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/dashboard" className="bg-brandblue-600 hover:bg-brandblue-700 px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
            Buka Dashboard
          </Link>
          <a href="https://discord.gg/your-invite" className="px-6 py-3 rounded-xl text-sm font-bold border border-white/20 hover:bg-white/10">
            Join Discord
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold">{s.n}</div>
              <div className="text-xs md:text-sm text-blue-100 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
