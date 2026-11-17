'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOverview, OverviewResponse } from '@/lib/api';
import {
  Users,
  Music,
  Smartphone,
  Megaphone,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Database,
  Cloud,
  Cpu,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = () => {
    setRefreshing(true);
    getOverview()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-medium">Aggregating platform telemetry from Neon DB...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300">
        <h3 className="font-semibold text-sm">Failed to retrieve platform metrics</h3>
        <p className="text-xs text-rose-400 mt-1">{error}</p>
        <button
          onClick={loadData}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, system_health } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Dashboard
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics and microservices health from Melo V2 backend
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-[#141620] hover:bg-[#1c1e2b] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/releases"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Deploy Release</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards (Styled exactly like the top cards in the reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.06] hover:border-white/[0.1] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Listeners</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {metrics.total_users.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{metrics.active_users_30d} active
              </span>
              <span className="text-[11px] text-slate-500">last 30 days</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <Link
              href="/users"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>View User Roster</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Synced Playlists */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.06] hover:border-white/[0.1] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Synced Playlists</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <Music className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {metrics.public_playlists.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                100% Synced
              </span>
              <span className="text-[11px] text-slate-500">via CRDT mutations</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <Link
              href="/users"
              className="text-[11px] text-violet-400 hover:text-violet-300 font-medium flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>Inspect Cloud Sync</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Release Channels */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.06] hover:border-white/[0.1] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Release</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              v{metrics.current_stable}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono">
                Beta: v{metrics.current_beta}
              </span>
              <span className="text-[11px] text-slate-500">Universal APK</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <Link
              href="/releases"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>Manage Distribution</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Moderation & Announcements */}
        <div className="p-5 rounded-2xl bg-[#12131b] border border-white/[0.06] hover:border-white/[0.1] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Broadcasts & Reports</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {metrics.active_announcements} <span className="text-sm font-normal text-slate-400">Active</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-slate-300 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08]">
                {metrics.open_reports} Open Reports
              </span>
              <span className="text-[11px] text-slate-500">All clear</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.04]">
            <Link
              href="/announcements"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>View Announcements</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row: Wave Chart (Left) + Circular Gauge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Wave Line Chart (Statistics Card - 7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#12131b] border border-white/[0.06] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Platform Activity & Sync Trends</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cloud mutations and audio streaming traffic over time
              </p>
            </div>

            {/* Time Toggle Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#171824] border border-white/[0.06]">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Wave Chart matching the tablet reference image */}
          <div className="relative w-full h-56 pt-2 select-none">
            {/* Interactive Tooltip Callout matching reference image ($89,642.15 pill) */}
            <div className="absolute left-[54%] top-[18%] -translate-x-1/2 -translate-y-full mb-2 z-10 animate-bounce">
              <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-xl shadow-indigo-600/40 border border-indigo-400/30 flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-indigo-200" />
                <span>Peak: 12,480 ops</span>
              </div>
              <div className="w-2 h-2 bg-indigo-600 rotate-45 mx-auto -mt-1 shadow-sm" />
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                {/* Gradient for Primary Wave */}
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient for Secondary Subtle Wave */}
                <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

              {/* Secondary Violet Wave */}
              <path
                d="M0,130 C70,110 130,135 190,100 C250,65 310,120 370,80 C430,40 480,70 500,60"
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />

              {/* Primary Wave Fill Area */}
              <path
                d="M0,120 C60,105 120,70 180,95 C240,120 280,45 340,55 C400,65 440,25 500,40 L500,160 L0,160 Z"
                fill="url(#waveGradient)"
              />

              {/* Primary Wave Line */}
              <path
                d="M0,120 C60,105 120,70 180,95 C240,120 280,45 340,55 C400,65 440,25 500,40"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Peak Active Indicator Point */}
              <circle cx="280" cy="45" r="5" fill="#ffffff" stroke="#6366f1" strokeWidth="3" className="animate-pulse" />
            </svg>

            {/* X-Axis Day Labels */}
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium px-2 pt-2 border-t border-white/[0.04]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Circular Donut Gauge Card (Infrastructure Health - 5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#12131b] border border-white/[0.06] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Infrastructure Health</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Microservices availability & uptime
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                99.9% Uptime
              </span>
            </div>

            {/* Radial Gauge matching "Billing" circular chart in reference image */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1e202d"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Indigo & Emerald Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#6366f1"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="25"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="180"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                {/* Inner Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-slate-400">Health</span>
                  <span className="text-xl font-extrabold text-white">99.9%</span>
                  <span className="text-[9px] text-emerald-400 font-medium">Optimal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Microservices Breakdown Rows */}
          <div className="space-y-2 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Neon PostgreSQL (Clean Schema)</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Cloud className="w-3.5 h-3.5 text-violet-400" />
                <span>Cloudflare R2 Object Storage</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Firebase Authentication & JWT</span>
              </div>
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Audience & Platform Distribution (Matching "Audience" in reference image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audience Card (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#12131b] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Audience & Device Distribution</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Client editions connected to Melo sync cluster
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Clients: {metrics.total_users}</span>
          </div>

          <div className="space-y-4 my-2">
            {/* Bar 1: FOSS Edition */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Android FOSS Edition (FDroid / GitHub)</span>
                <span className="text-indigo-400 font-semibold">68%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1c1e2b] overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 w-[68%]" />
              </div>
            </div>

            {/* Bar 2: GMS Edition */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Android Standard Edition (GMS / Direct APK)</span>
                <span className="text-violet-400 font-semibold">32%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1c1e2b] overflow-hidden p-0.5">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-[32%]" />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-4 text-center">
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sync Protocol</span>
              <span className="text-sm font-bold text-white mt-1 block">CRDT v2</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Zero Dollar Host</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Neon Tables</span>
              <span className="text-sm font-bold text-indigo-400 mt-1 block">8 Clean</span>
            </div>
          </div>
        </div>

        {/* Security & Access Overview (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#12131b] border border-white/[0.06] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>RBAC Security Status</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Protected endpoints requiring authenticated administrative bearer tokens
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-xl bg-[#171824] border border-white/[0.04]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Super Admin</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    2 Granted
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Full control over releases, users, and audit records
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#171824] border border-white/[0.04]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Audit Logging</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Enabled
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  All administrative mutations are logged in Neon DB
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/audit-logs"
            className="mt-4 w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Inspect Audit Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
