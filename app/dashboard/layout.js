import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

const WORKSHOP_ITEMS = [
  { href: '/dashboard/workshop', label: 'Workshop' },
  { href: '/dashboard/mekanik', label: 'Anggota Mekanik' },
  { href: '/dashboard/logs-komponen', label: 'Logs Komponen' },
  { href: '/dashboard/setoran-modif', label: 'Setoran Modif' },
  { href: '/dashboard/duty-mekanik', label: 'Log Duty Mekanik' },
  { href: '/dashboard/komponen-tracking', label: 'Data Komponen' },
  { href: '/dashboard/gaji', label: 'List Gaji' },
  { href: '/dashboard/blacklist-workshop', label: 'Blacklist' },
  { href: '/dashboard/chat', label: 'Chat Komunitas' },
];

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const user = await getCachedUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase.from('profiles').select('discord_username, avatar_url').eq('id', user.id).single(),
    supabase.from('profile_permissions').select('*').eq('id', user.id).single(),
  ]);

  const isSuperAdmin = perms?.is_super_admin || false;
  const isAdminWorkshop = isSuperAdmin || (perms?.admin_workshop_ids?.length || 0) > 0;
  const isMemberWorkshop = (perms?.member_workshop_ids?.length || 0) > 0;

  const workshopItems = [
    ...(isAdminWorkshop ? WORKSHOP_ITEMS : []),
    ...(isMemberWorkshop ? [{ href: '/dashboard/panel-workshop', label: 'Panel Mekanik Saya' }] : []),
    ...(!isAdminWorkshop && !isMemberWorkshop ? [{ href: '/dashboard/panel-warga', label: 'Panel Warga' }] : []),
    ...(!isAdminWorkshop ? [{ href: '/dashboard/chat', label: 'Chat Komunitas' }] : []),
  ];

  const NAV = [
    { group: 'Workshop', items: workshopItems },
    ...(isSuperAdmin ? [{ group: 'Admin', items: [{ href: '/dashboard/role-mappings', label: 'Role Mappings' }] }] : []),
  ];

  return (
    <DashboardShell nav={NAV} profile={profile}>
      {children}
    </DashboardShell>
  );
}
