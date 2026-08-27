'use client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function HomeCta({ loggedIn }) {
  const supabase = createClient();

  async function loginWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (loggedIn) {
    return (
      <Link href="/dashboard" className="w-full sm:w-auto bg-brandblue-600 hover:bg-brandblue-700 px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
        Buka Dashboard
      </Link>
    );
  }

  return (
    <button
      onClick={loginWithDiscord}
      className="w-full sm:w-auto bg-[#5865F2] hover:bg-[#4752c4] px-6 py-3 rounded-xl text-sm font-bold shadow-lg"
    >
      Login dengan Discord
    </button>
  );
}
