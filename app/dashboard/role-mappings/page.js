import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CrudTable from '@/components/CrudTable';

const FIELDS = [
  { name: 'discord_role_id', label: 'Discord Role ID', type: 'text' },
  { name: 'label', label: 'Label', type: 'text', placeholder: 'cth. Gravencio' },
  {
    name: 'type', label: 'Tipe', type: 'select',
    options: ['member_badside', 'admin_badside', 'member_workshop', 'admin_workshop', 'super_admin'],
  },
  { name: 'badside_id', label: 'Badside (kalau tipe terkait badside)', type: 'relation', rel: 'badside' },
  { name: 'workshop_id', label: 'Workshop (kalau tipe terkait workshop)', type: 'relation', rel: 'workshop' },
];

export default async function RoleMappingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: perms } = await supabase.from('profile_permissions').select('is_super_admin').eq('id', user.id).single();
  if (!perms?.is_super_admin) redirect('/dashboard');

  const [{ data: rows }, { data: badside }, { data: workshop }] = await Promise.all([
    supabase.from('role_mappings').select('*').order('created_at', { ascending: false }),
    supabase.from('badside').select('id, nama'),
    supabase.from('workshop').select('id, nama'),
  ]);

  const relations = {
    badside: (badside || []).map((b) => ({ id: b.id, label: b.nama })),
    workshop: (workshop || []).map((w) => ({ id: w.id, label: w.nama })),
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 text-brandblue-700 text-sm rounded-xl p-4">
        Cara dapat <strong>Discord Role ID</strong>: di Discord aktifkan Developer Mode (Settings &gt; Advanced), lalu klik kanan role di Server Settings &gt; Roles &gt; Copy ID.
        Contoh: role Discord bernama &quot;Gravencio&quot; dipetakan ke tipe <code>member_badside</code> dengan Badside = &quot;Gravencio Gang Syndicate&quot; — begitu anggota dengan role itu klik &quot;Sinkron Role&quot; di Profil, badge Gravencio otomatis muncul.
      </div>
      <CrudTable table="role_mappings" label="Role Mapping" fields={FIELDS} rows={rows || []} relations={relations} />
    </div>
  );
}
