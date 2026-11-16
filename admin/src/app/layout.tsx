import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Melo V2 — Admin Console',
  description: 'Administrative dashboard for Melo V2 Music Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d0f12] text-gray-100 min-h-screen">
        <Sidebar />
        <main className="pl-64 min-h-screen">
          <header className="h-16 border-b border-[#262b36] bg-[#161a22]/70 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-base font-semibold text-gray-200">Management Dashboard</h2>
            <div className="flex items-center space-x-4">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                Connected
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-200">
                AD
              </div>
            </div>
          </header>
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
