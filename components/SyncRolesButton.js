'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncRolesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function sync() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/sync-roles', { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Gagal sinkron');
      return;
    }
    router.refresh();
  }

  return (
    <div className="text-right">
      <button
        onClick={sync}
        disabled={loading}
        className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
      >
        {loading ? 'Menyinkron...' : 'Sinkron Role'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1 max-w-[200px]">{error}</p>}
    </div>
  );
}
