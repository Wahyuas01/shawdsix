'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ChatBox({ senderId, senderName }) {
  const supabase = createClient();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.from('chat_messages').select('*').order('created_at').then(({ data }) => setMessages(data || []));

    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((m) => [...m, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await supabase.from('chat_messages').insert({
      sender_id: senderId,
      sender_name: senderName,
      pesan: text,
      channel: 'general',
    });
    setSending(false);
    setText('');
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[calc(100vh-140px)]">
      <div className="px-6 py-4 border-b border-slate-200">
        <h1 className="font-extrabold text-navy-950">Chat Komunitas</h1>
        <p className="text-sm text-slate-500">Ruang diskusi Workshop</p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">Belum ada pesan. Mulai obrolan pertama!</p>}
        {messages.map((m) => (
          <div key={m.id} className="max-w-md">
            <div className="text-xs font-semibold text-brandblue-600">{m.sender_name}</div>
            <div className="bg-slate-100 rounded-xl px-3 py-2 text-sm text-slate-700 mt-0.5">{m.pesan}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{new Date(m.created_at).toLocaleString('id-ID')}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Kirim sebagai ${senderName}...`}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1"
          required
        />
        <button disabled={sending} type="submit" className="bg-brandblue-600 hover:bg-brandblue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 rounded-lg">
          Kirim
        </button>
      </form>
    </div>
  );
}
