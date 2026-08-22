'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={logout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10 mt-4">
      Keluar
    </button>
  );
}
