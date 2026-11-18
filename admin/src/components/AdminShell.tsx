'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';
import { MeloLogo, MeloSearchIcon, MeloCloudIcon } from './MeloIcons';
import { Bell } from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Protect non-login routes
  useEffect(() => {
    if (mounted && !loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, mounted, pathname, router]);

  const isLoginPage = pathname === '/login';
  const showLoadingOverlay = !mounted || (loading && !isLoginPage) || (!user && !isLoginPage);

  return (
    <div className="min-h-screen text-white flex relative font-['Inter'] selection:bg-[#f5e27a]/25 selection:text-white">
      {/* Loading Overlay with authentic Melo Logo */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 bg-[#0e0e0f]/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white select-none">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-[#1b1b1f] border border-white/[0.12] flex items-center justify-center shadow-2xl shadow-black">
              <MeloLogo size={36} className="text-[#f5e27a] animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-[#f5e27a]/30 animate-ping pointer-events-none" />
          </div>
          <p className="text-sm font-bold text-white tracking-tight">Verifying Melo Administrator...</p>
          <p className="text-xs text-[#a6a6ad] mt-1">Cryptographic session & RBAC handshake</p>
        </div>
      )}

      {/* Render Clean Canvas for Login Page */}
      {isLoginPage ? (
        <div className="w-full min-h-screen">
          {children}
        </div>
      ) : (
        /* Render Full Admin Shell Layout */
        <div className="w-full flex min-h-screen">
          <Sidebar />

          <div className="pl-64 flex-1 flex flex-col min-h-screen min-w-0">
            {/* Top Header */}
            <header className="h-18 border-b border-white/[0.08] bg-[#0e0e10]/80 backdrop-blur-2xl px-8 flex items-center justify-between sticky top-0 z-20">
              {/* Search Bar with Melo Search Icon */}
              <div className="relative w-80 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a6a6ad]">
                  <MeloSearchIcon size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search listeners, releases, sync..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-[#18181b] border border-white/[0.08] rounded-full text-xs text-white placeholder-[#6c6c74] focus:outline-none focus:ring-2 focus:ring-[#f5e27a]/30 focus:border-[#f5e27a]/50 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.1] text-[#a6a6ad]">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Right Header Actions */}
              <div className="flex items-center gap-4">
                {/* Live System Status Pill */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#30d158]/10 border border-[#30d158]/20 text-[#30d158] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158]" />
                  <span className="tracking-tight">Cluster Active</span>
                </div>

                {/* Cloud Sync Status */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181b] border border-white/[0.06] text-xs font-semibold text-[#a6a6ad]">
                  <MeloCloudIcon size={15} className="text-[#f5e27a]" />
                  <span>Sync Online</span>
                </div>

                {/* Notification Bell */}
                <button
                  title="System notifications"
                  className="p-2.5 rounded-2xl bg-[#18181b] border border-white/[0.08] text-[#a6a6ad] hover:text-white hover:bg-white/[0.06] transition-colors relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#f5e27a] ring-2 ring-[#0e0e10]" />
                </button>

                {/* Admin Avatar Pill */}
                <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
                  <div className="w-8 h-8 rounded-full bg-[#232327] border border-white/[0.12] flex items-center justify-center font-bold text-xs text-white">
                    {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'ME'}
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
