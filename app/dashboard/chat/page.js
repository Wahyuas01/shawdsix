import { createClient } from '@/lib/supabase/server';
import { getCachedUser } from '@/lib/supabase/get-user';
import ChatBox from '@/components/ChatBox';

export default async function ChatPage() {
  const supabase = createClient();
  const user = await getCachedUser();
  const { data: profile } = await supabase.from('profiles').select('discord_username').eq('id', user.id).single();

  return (
    <ChatBox
      senderId={user.id}
      senderName={profile?.discord_username || 'Warga'}
    />
  );
}
