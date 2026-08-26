'use client';
import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardShell({ nav, profile, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Top bar - cuma muncul di mobile/tablet */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-navy-950 text-white flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10" aria-label="Buka menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-white text-[10px]">
            SD
          </div>
          <span className="font-extrabold text-sm">Shaw D&apos;SIX</span>
        </Link>
        <Link href="/dashboard/profile" className="p-0.5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-700" />
          )}
        </Link>
      </header>

      {/* Overlay gelap pas sidebar mobile terbuka */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar: off-canvas di mobile (translate), fixed di desktop (lg:) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 bg-navy-950 text-slate-200 p-4 flex flex-col z-50 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandblue-500 to-brandblue-700 flex items-center justify-center font-extrabold text-white text-xs">
              SD
            </div>
            <span className="font-extrabold text-white text-sm">Shaw D&apos;SIX</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-white/10" aria-label="Tutup menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {nav.map((g) => (
            <div key={g.group}>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 mb-1">{g.group}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/10">
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-3 mt-3">
          <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700" />
            )}
            <span className="text-sm truncate">{profile?.discord_username || 'Profil'}</span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
