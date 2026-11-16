'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Overview', href: '/' },
  { name: 'Users', href: '/users' },
  { name: 'App Releases', href: '/releases' },
  { name: 'Announcements', href: '/announcements' },
  { name: 'Moderation Reports', href: '/reports' },
  { name: 'Audit Logs', href: '/audit-logs' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#161a22] border-r border-[#262b36] flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-[#262b36] flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#ff3b5c] flex items-center justify-center font-bold text-white text-lg">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">Melo V2</h1>
          <p className="text-xs text-gray-400">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#ff3b5c] text-white shadow-md'
                  : 'text-gray-300 hover:bg-[#202531] hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#262b36]">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Backend: Go 1.25</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </aside>
  );
}
