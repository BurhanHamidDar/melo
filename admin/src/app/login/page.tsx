'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MeloLogo } from '@/components/MeloIcons';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0e0e0f] text-white flex items-center justify-center p-4 relative overflow-hidden select-none font-['Inter']">
      {/* Background Ambient Warm Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#f5e27a]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#30d158]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Melo Dotted Ground */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1.2px)`,
          backgroundSize: '22px 22px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Main Card with Melo Frosted Glass */}
        <div className="bg-[#141416]/90 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1c1c1f] border border-white/[0.12] p-2 shadow-xl shadow-black/60 mb-4 transition-transform hover:scale-105">
              <MeloLogo size={36} className="text-[#f5e27a]" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-['Inter']">melo</h1>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#f5e27a]/15 text-[#f5e27a] border border-[#f5e27a]/30">
                CONSOLE
              </span>
            </div>
            <p className="text-xs text-[#a6a6ad] font-medium">
              Music, With style &lt;3
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30d158]/10 border border-[#30d158]/20 text-[#30d158] text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
              <span>RBAC Role Protected • End-to-End Encrypted</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#ff6b5e]/10 border border-[#ff6b5e]/30 text-[#ff6b5e] text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-[#ff6b5e] flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#a6a6ad] mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6c6c74]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@melo.app or name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#1a1a1d] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#6c6c74] focus:outline-none focus:ring-2 focus:ring-[#f5e27a]/30 focus:border-[#f5e27a]/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a6a6ad] mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6c6c74]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#1a1a1d] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#6c6c74] focus:outline-none focus:ring-2 focus:ring-[#f5e27a]/30 focus:border-[#f5e27a]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6c6c74] hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-full bg-white hover:bg-[#e6e6e6] text-black font-bold text-sm shadow-xl shadow-white/10 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#141416] px-3 text-[#6c6c74] font-semibold">or continue with</span>
            </div>
          </div>

          {/* Google Sign-in with Melo Pill Style */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full bg-[#1c1c1f] hover:bg-[#242427] border border-white/[0.08] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Security Notice */}
          <div className="mt-8 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-[#6c6c74] leading-relaxed">
              Restricted console for verified administrators. Access privileges are verified against PostgreSQL <code className="text-[#a6a6ad] font-mono">admin_roles</code>. Unofficial attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
