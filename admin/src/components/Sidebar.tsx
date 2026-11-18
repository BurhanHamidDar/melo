'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Megaphone,
  Flag,
  ShieldCheck,
  LogOut,
  Sparkles,
  Layers,
  Activity,
  ChevronRight,
  Globe,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users & Sync', href: '/users', icon: Users },
  { name: 'App Releases', href: '/releases', icon: Smartphone },
  { name: 'Landing Page CMS', href: '/landing', icon: Globe },
  { name: 'Announcements', href: '/announcements', icon: Megaphone },
  { name: 'Moderation Reports', href: '/reports', icon: Flag },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0d0e13] border-r border-white/[0.06] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
            <span className="font-extrabold text-white text-lg">M</span>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">Melo Cloud</h1>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">v2.0 Console</p>
          </div>
        </div>

        {/* Workspace Pill */}
        <div className="mt-3.5 px-3 py-1.5 rounded-lg bg-[#141620] border border-white/[0.05] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate text-[11px] font-medium">Production Cluster</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Status Footer */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-[#141620] border border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'admin@melo.app'}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out of console"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* System Status Indicator */}
        <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px]">Neon DB • Go REST</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-medium">99.9%</span>
        </div>
      </div>
    </aside>
  );
}
