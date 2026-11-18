'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  MeloLogo,
  MeloHomeIcon,
  MeloUsersIcon,
  MeloReleasesIcon,
  MeloGlobeIcon,
  MeloAnnouncementsIcon,
  MeloReportsIcon,
  MeloAuditIcon,
  MeloCloudIcon,
} from './MeloIcons';
import { LogOut, ChevronRight } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: MeloHomeIcon },
  { name: 'Users & Sync', href: '/users', icon: MeloUsersIcon },
  { name: 'App Releases', href: '/releases', icon: MeloReleasesIcon },
  { name: 'Landing Page CMS', href: '/landing', icon: MeloGlobeIcon },
  { name: 'Announcements', href: '/announcements', icon: MeloAnnouncementsIcon },
  { name: 'Moderation Reports', href: '/reports', icon: MeloReportsIcon },
  { name: 'Audit Logs', href: '/audit-logs', icon: MeloAuditIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0e0e10]/95 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b1b1f] border border-white/[0.12] flex items-center justify-center shadow-lg shadow-black/50 flex-shrink-0 text-white">
            <MeloLogo size={24} className="text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white font-['Inter']">melo</h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#f5e27a]/15 text-[#f5e27a] border border-[#f5e27a]/30">
                CONSOLE
              </span>
            </div>
            <p className="text-[11px] text-[#a6a6ad] truncate font-medium">Music, With style &lt;3</p>
          </div>
        </div>

        {/* Workspace Pill */}
        <div className="mt-3.5 px-3 py-1.5 rounded-full bg-[#18181b] border border-white/[0.06] flex items-center justify-between text-xs text-[#a6a6ad]">
          <div className="flex items-center gap-2 truncate">
            <MeloCloudIcon size={15} className="text-[#f5e27a] flex-shrink-0" />
            <span className="truncate text-[11px] font-semibold tracking-tight text-white/90">Cloud Sync Active</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#30d158] shadow-[0_0_8px_#30d158] flex-shrink-0" />
        </div>
      </div>

      {/* Navigation matching AppNavigationBar.kt */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6c6c74]">
          Navigation
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                  : 'text-[#a6a6ad] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  size={18}
                  filled={isActive}
                  className={`flex-shrink-0 ${
                    isActive ? 'text-black' : 'text-[#a6a6ad] group-hover:text-white'
                  }`}
                />
                <span className="truncate tracking-tight">{item.name}</span>
              </div>
              {isActive ? (
                <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/20 opacity-0 hover:opacity-100" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Status Footer */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        {/* User Card */}
        <div className="p-2.5 rounded-2xl bg-[#18181b] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#232327] border border-white/[0.08] flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.displayName || 'Administrator'}
              </p>
              <p className="text-[10px] text-[#a6a6ad] truncate">
                {user?.email || 'admin@melo.app'}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out of console"
            className="p-1.5 rounded-xl text-[#a6a6ad] hover:text-[#ff6b5e] hover:bg-[#ff6b5e]/10 transition-colors cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* System Status Indicator */}
        <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] text-[#6c6c74]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            <span className="text-[10px] font-medium">Neon PostgreSQL • Go REST</span>
          </span>
          <span className="text-[10px] font-mono text-[#30d158] font-bold">LIVE</span>
        </div>
      </div>
    </aside>
  );
}
