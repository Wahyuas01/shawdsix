import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import ChatBox from '@/components/ChatBox';

export default async function ChatPage() {
  const supabase = createClient();
  const user = await getCachedUser();
  const [{ data: profile }, { data: mekanik }] = await Promise.all([
    supabase.from('profiles').select('discord_username').eq('id', user.id).single(),
    supabase.from('mekanik').select('nama').eq('profile_id', user.id).maybeSingle(),
  ]);

  // Mekanik pakai nama mekanik-nya di chat, selain itu (warga/admin) pakai username Discord.
  const senderName = mekanik?.nama || profile?.discord_username || 'Warga';

  return (
    <ChatBox
      senderId={user.id}
      senderName={senderName}
    />
  );
}
