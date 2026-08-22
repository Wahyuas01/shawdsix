import { createClient } from '@/lib/supabase/server';

async function count(supabase, table) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return count || 0;
}

export default async function DashboardHome() {
  const supabase = createClient();
  const [badside, anggota, workshop, mekanik, setoranBadside, setoranModif] = await Promise.all([
    count(supabase, 'badside'),
    count(supabase, 'anggota_badside'),
    count(supabase, 'workshop'),
    count(supabase, 'mekanik'),
    count(supabase, 'setoran_badside'),
    count(supabase, 'setoran_modif'),
  ]);

  const Card = ({ n, label }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-2xl font-extrabold text-navy-950">{n}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-extrabold text-xl text-navy-950">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan komunitas Shaw D&apos;SIX</p>
      </div>
      <div>
        <h2 className="font-bold text-navy-950 mb-3">Badside / Family</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card n={badside} label="Badside" />
          <Card n={anggota} label="Anggota" />
          <Card n={setoranBadside} label="Setoran" />
        </div>
      </div>
      <div>
        <h2 className="font-bold text-navy-950 mb-3">Workshop</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card n={workshop} label="Workshop" />
          <Card n={mekanik} label="Mekanik" />
          <Card n={setoranModif} label="Setoran Modif" />
        </div>
      </div>
    </div>
  );
}
