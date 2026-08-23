import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    // Sinkron role Discord -> izin workshop tiap kali user login.
    try {
      await fetch(`${origin}/api/sync-roles`, { method: 'POST', headers: { Cookie: request.headers.get('cookie') || '' } });
    } catch (e) {
      // Kalau gagal (mis. bot belum diset), biarkan lanjut — user tetap bisa login,
      // cuma belum dapat izin workshop sampai sync manual berhasil.
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
