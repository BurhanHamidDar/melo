import './globals.css';
import { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { AdminShell } from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'Melo V2 — Cloud Console',
  description: 'Enterprise Administrative Dashboard for Melo V2 Music Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0b0f] text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-white">
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
