import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

const BADSIDE_ITEMS = [
  { href: '/dashboard/badside', label: 'Badside' },
  { href: '/dashboard/anggota-badside', label: 'Anggota Badside' },
  { href: '/dashboard/gudang-badside', label: 'Gudang Badside' },
  { href: '/dashboard/setoran-badside', label: 'Setoran Anggota' },
  { href: '/dashboard/log-anggota-badside', label: 'Log Anggota' },
  { href: '/dashboard/blacklist-badside', label: 'Blacklist' },
];

const WORKSHOP_ITEMS = [
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
];

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase.from('profiles').select('discord_username, avatar_url').eq('id', user.id).single(),
    supabase.from('profile_permissions').select('*').eq('id', user.id).single(),
  ]);

  const isSuperAdmin = perms?.is_super_admin || false;
  const isAdminBadside = isSuperAdmin || (perms?.admin_badside_ids?.length || 0) > 0;
  const isMemberBadside = (perms?.member_badside_ids?.length || 0) > 0;
  const isAdminWorkshop = isSuperAdmin || (perms?.admin_workshop_ids?.length || 0) > 0;
  const isMemberWorkshop = (perms?.member_workshop_ids?.length || 0) > 0;

  const badsideItems = isAdminBadside
    ? BADSIDE_ITEMS
    : isMemberBadside
      ? [{ href: '/dashboard/panel-badside', label: 'Panel Badside Saya' }]
      : [];

  const workshopItems = isAdminWorkshop
    ? WORKSHOP_ITEMS
    : isMemberWorkshop
      ? [{ href: '/dashboard/panel-workshop', label: 'Panel Mekanik Saya' }, { href: '/dashboard/chat', label: 'Chat Komunitas' }]
      : [{ href: '/dashboard/chat', label: 'Chat Komunitas' }];

  const NAV = [
    ...(badsideItems.length ? [{ group: 'Badside / Family', items: badsideItems }] : []),
    { group: 'Workshop', items: workshopItems },
    ...(isSuperAdmin ? [{ group: 'Admin', items: [{ href: '/dashboard/role-mappings', label: 'Role Mappings' }] }] : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-navy-950 text-slate-200 p-4 flex flex-col">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-white text-xs">
            SD
          </div>
          <span className="font-extrabold text-white text-sm">Shaw D&apos;SIX</span>
        </Link>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {!isAdminBadside && !isMemberBadside && !isAdminWorkshop && !isMemberWorkshop && (
            <p className="text-xs text-slate-500 px-2">
              Kamu belum terhubung ke Badside atau Workshop manapun. Cek halaman Profil untuk sinkron role Discord.
            </p>
          )}
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
        </div>

        <div className="border-t border-white/10 pt-3 mt-3">
          <Link href="/dashboard/profile" className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700" />
            )}
            <span className="text-sm truncate">{profile?.discord_username || 'Profil'}</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">{children}</main>
    </div>
  );
}
