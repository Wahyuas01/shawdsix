import { createClient } from '@/lib/supabase/server';
import SyncRolesButton from '@/components/SyncRolesButton';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profile_permissions').select('*').eq('id', user.id).single(),
  ]);

  const workshopIds = [...new Set([...(perms?.admin_workshop_ids || []), ...(perms?.member_workshop_ids || [])])];

  const { data: workshopList } = workshopIds.length
    ? await supabase.from('workshop').select('id, nama').in('id', workshopIds)
    : { data: [] };

  const badges = (workshopList || []).map((w) => ({
    label: w.nama,
    role: perms?.admin_workshop_ids?.includes(w.id) ? 'Admin Workshop' : 'Mekanik',
    color: perms?.admin_workshop_ids?.includes(w.id) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600',
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">Profil</h1>
        <p className="text-sm text-slate-500">Identitas dan keanggotaan kamu di Shaw D&apos;SIX</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-200" />
        )}
        <div className="flex-1">
          <div className="font-bold text-navy-950">{profile?.discord_username || 'Tanpa nama'}</div>
          <div className="text-xs text-slate-500">
            {perms?.is_super_admin ? 'Super Admin' : 'Anggota Komunitas'}
            {perms?.synced_at && ` · Sinkron terakhir ${new Date(perms.synced_at).toLocaleString('id-ID')}`}
          </div>
        </div>
        <SyncRolesButton />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="font-bold text-navy-950 mb-3">Keanggotaan</h2>
        {badges.length === 0 && !perms?.is_super_admin && (
          <p className="text-sm text-slate-400">
            Belum ada badge. Pastikan kamu sudah punya role Mekanik yang sesuai di server Discord, lalu klik &quot;Sinkron Role&quot;.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {perms?.is_super_admin && (
            <span className="badge bg-red-50 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-full">Super Admin</span>
          )}
          {badges.map((b, i) => (
            <span key={i} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${b.color}`}>
              {b.label} · {b.role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
