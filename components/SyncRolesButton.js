'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncRolesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function sync() {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch('/api/sync-roles', { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Gagal sinkron');
      return;
    }

    const matched = json.is_super_admin || json.admin_workshop_ids?.length || json.member_workshop_ids?.length;
    if (!matched) {
      setError(
        `Sinkron berhasil, tapi Discord kamu punya ${json.discord_role_count ?? '?'} role dan TIDAK ADA yang cocok dengan Role Mappings. ` +
        `Cek lagi: ID role Discord-nya bener, Workshop-nya udah dipilih (bukan kosong), dan kamu beneran punya role itu di server.`
      );
    } else if (json.mekanik_error) {
      setError('Role kamu cocok, tapi gagal nyimpen data mekanik: ' + json.mekanik_error);
    } else {
      setResult(json);
    }
    router.refresh();
  }

  return (
    <div className="text-right max-w-[240px]">
      <button
        onClick={sync}
        disabled={loading}
        className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        {loading ? 'Menyinkron...' : 'Sinkron Role'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1.5 text-left">{error}</p>}
      {result && (
        <p className="text-xs text-emerald-600 mt-1.5 text-left">
          Berhasil — {result.is_super_admin && 'Super Admin'}
          {result.admin_workshop_ids?.length ? ` · Admin Workshop (${result.admin_workshop_ids.length})` : ''}
          {result.member_workshop_ids?.length ? ` · Mekanik (${result.member_workshop_ids.length} workshop)` : ''}
        </p>
      )}
    </div>
  );
}
