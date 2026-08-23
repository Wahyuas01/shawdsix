import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * PENTING: pakai SUPABASE_SERVICE_ROLE_KEY (bukan anon key), dan JANGAN
 * pernah import file ini di client component / kirim ke browser.
 * Dipakai untuk menulis profile_permissions & role_mappings hasil sinkron
 * dari Discord, yang sengaja tidak bisa ditulis lewat anon key + RLS.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
