import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

const NAV = [
  {
    group: 'Badside / Family',
    items: [
      { href: '/dashboard/badside', label: 'Badside' },
      { href: '/dashboard/anggota-badside', label: 'Anggota Badside' },
      { href: '/dashboard/gudang-badside', label: 'Gudang Badside' },
      { href: '/dashboard/setoran-badside', label: 'Setoran Anggota' },
      { href: '/dashboard/log-anggota-badside', label: 'Log Anggota' },
      { href: '/dashboard/blacklist-badside', label: 'Blacklist' },
    ],
  },
  {
    group: 'Workshop',
    items: [
      { href: '/dashboard/workshop', label: 'Workshop' },
      { href: '/dashboard/mekanik', label: 'Anggota Mekanik' },
      { href: '/dashboard/gudang-workshop', label: 'Gudang Workshop' },
      { href: '/dashboard/setoran-modif', label: 'Setoran Modif' },
      { href: '/dashboard/komponen-tracking', label: 'Data Komponen' },
      { href: '/dashboard/keuangan-workshop', label: 'Data Uang' },
      { href: '/dashboard/gaji', label: 'List Gaji' },
      { href: '/dashboard/lamaran-mekanik', label: 'Lamaran Mekanik' },
      { href: '/dashboard/blacklist-workshop', label: 'Blacklist' },
      { href: '/dashboard/logs-workshop', label: 'Log Anggota' },
      { href: '/dashboard/report-mingguan', label: 'Report Mingguan' },
      { href: '/dashboard/rating-mekanik', label: 'Rating Mekanik' },
      { href: '/dashboard/chat', label: 'Chat Komunitas' },
    ],
  },
];

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-navy-950 text-slate-200 p-4 space-y-6">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-white text-xs">
            SD
          </div>
          <span className="font-extrabold text-white text-sm">Shaw D&apos;SIX</span>
        </Link>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 mb-1">{g.group}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <LogoutButton />
      </aside>
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
