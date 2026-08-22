'use client';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();

  async function loginWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-white mb-4">
          SD
        </div>
        <h1 className="font-extrabold text-xl text-navy-950 mb-2">Masuk ke Portal</h1>
        <p className="text-sm text-slate-500 mb-6">Login pakai akun Discord kamu untuk mengakses dashboard.</p>
        <button
          onClick={loginWithDiscord}
          className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold py-3 rounded-xl text-sm"
        >
          Login dengan Discord
        </button>
      </div>
    </main>
  );
}
