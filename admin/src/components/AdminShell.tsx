'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';
import {
  Search,
  Bell,
  Music2,
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0b0f] text-slate-100 flex relative">
      {/* Loading Overlay: Preserves children in React component tree so Webpack manifests never desync */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 bg-[#0a0b0f] flex flex-col items-center justify-center text-slate-100 select-none">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 animate-pulse flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <Music2 className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/40 animate-ping" />
          </div>
          <p className="text-sm font-medium text-slate-300">Verifying Administrator Privileges...</p>
          <p className="text-xs text-slate-500 mt-1">Checking cryptographic session & RBAC policies</p>
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
            <header className="h-18 border-b border-white/[0.06] bg-[#0d0e13]/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
              {/* Search Bar */}
              <div className="relative w-80 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search listeners, releases, logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 bg-[#141620] border border-white/[0.06] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-400">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Right Header Actions */}
              <div className="flex items-center gap-4">
                {/* Live System Status Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Melo Cloud Active</span>
                </div>

                {/* Notification Bell */}
                <button
                  title="Recent alerts"
                  className="p-2 rounded-xl bg-[#141620] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-[#0d0e13]" />
                </button>

                {/* Admin Avatar Pill */}
                <div className="flex items-center gap-3 pl-2 border-l border-white/[0.08]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-600/20 ring-1 ring-white/10">
                    {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">
                      {user?.displayName || 'Administrator'}
                    </p>
                    <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
                      Super Admin
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard Content */}
            <main className="p-8 max-w-7xl mx-auto w-full flex-1">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
