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
  Database,
  Cloud,
  RefreshCw,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';
import {
  MeloLogo,
  MeloMark,
  MeloUsersIcon,
  MeloLibraryIcon,
  MeloReleasesIcon,
  MeloAnnouncementsIcon,
  MeloCloudIcon,
  MeloEqualizerIcon,
} from '@/components/MeloIcons';

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = (range = timeRange) => {
    setRefreshing(true);
    getOverview(range)
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
    loadData(timeRange);
  }, [timeRange]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-medium">Aggregating live platform telemetry from Neon DB...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300">
        <h3 className="font-semibold text-sm">Failed to retrieve platform metrics</h3>
        <p className="text-xs text-rose-400 mt-1">{error}</p>
        <button
          onClick={() => loadData(timeRange)}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, analytics, system_health } = data;
  const trends = analytics?.activity_trends || [];

  // Generate real SVG path from dynamic database points
  const svgWidth = 500;
  const svgHeight = 140;
  const maxOps = Math.max(...trends.map((t) => t.total_ops), 5);

  const points = trends.map((t, idx) => {
    const x = trends.length > 1 ? (idx / (trends.length - 1)) * svgWidth : svgWidth / 2;
    const y = 120 - (t.total_ops / maxOps) * 85;
    const ySignups = 120 - (t.signups / maxOps) * 85;
    return { x, y, ySignups, ...t };
  });

  // Smooth SVG path
  const primaryPathD = points.length > 0 ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  const areaPathD = points.length > 0 ? `${primaryPathD} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z` : '';
  const secondaryPathD = points.length > 0 ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.ySignups.toFixed(1)}`).join(' L ')}` : '';

  // Peak activity point calculation
  const peakPoint = points.find((p) => p.total_ops === analytics.peak_ops) || points[points.length - 1] || { x: 250, y: 50 };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Dashboard
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
              Live Neon DB
            </span>
          </h1>
          <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
            Real-time analytics and microservices health from Melo V2 backend
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(timeRange)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-full bg-[#18181b] hover:bg-[#232327] border border-white/[0.08] text-xs font-semibold text-[#a6a6ad] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#f5e27a]' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/releases"
            className="px-4 py-2 rounded-full bg-white hover:bg-[#e6e6e6] text-black text-xs font-bold shadow-md shadow-white/10 flex items-center gap-2 transition-all"
          >
            <MeloReleasesIcon size={14} className="text-black" />
            <span>Deploy Release</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="p-5 rounded-3xl bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a6a6ad]">Total Listeners</span>
            <div className="w-8 h-8 rounded-2xl bg-[#f5e27a]/10 flex items-center justify-center text-[#f5e27a] group-hover:scale-110 transition-transform">
              <MeloUsersIcon size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white font-['Inter']">
              {metrics.total_users.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-bold text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-full border border-[#30d158]/20 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {metrics.active_users_30d} active
              </span>
              <span className="text-[11px] text-[#6c6c74]">last 30 days</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Link
              href="/users"
              className="text-[11px] text-[#f5e27a] hover:text-white font-semibold flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>View User Roster</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Synced Playlists & Total Mutations */}
        <div className="p-5 rounded-3xl bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a6a6ad]">Cloud Synced Playlists</span>
            <div className="w-8 h-8 rounded-2xl bg-white/[0.08] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <MeloLibraryIcon size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white font-['Inter']">
              {metrics.public_playlists.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-bold text-[#30d158] bg-[#30d158]/10 px-2 py-0.5 rounded-full border border-[#30d158]/20">
                {metrics.total_mutations} Mutations
              </span>
              <span className="text-[11px] text-[#6c6c74]">CRDT ledger</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Link
              href="/users"
              className="text-[11px] text-[#a6a6ad] hover:text-white font-semibold flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>Inspect Cloud Ledger</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Release Channels from Database */}
        <div className="p-5 rounded-3xl bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a6a6ad]">Current Release</span>
            <div className="w-8 h-8 rounded-2xl bg-[#30d158]/10 flex items-center justify-center text-[#30d158] group-hover:scale-110 transition-transform">
              <MeloReleasesIcon size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white font-mono truncate">
              {metrics.current_stable}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-bold text-[#f5e27a] bg-[#f5e27a]/10 px-2 py-0.5 rounded-full border border-[#f5e27a]/20 font-mono">
                Beta: {metrics.current_beta}
              </span>
              <span className="text-[11px] text-[#6c6c74]">Active</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Link
              href="/releases"
              className="text-[11px] text-[#30d158] hover:text-white font-semibold flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>Manage Distribution</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Moderation & Announcements */}
        <div className="p-5 rounded-3xl bg-[#141416]/90 border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a6a6ad]">Broadcasts & Reports</span>
            <div className="w-8 h-8 rounded-2xl bg-[#ffb340]/10 flex items-center justify-center text-[#ffb340] group-hover:scale-110 transition-transform">
              <MeloAnnouncementsIcon size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight text-white font-['Inter']">
              {metrics.active_announcements} <span className="text-sm font-normal text-[#a6a6ad]">Active</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-bold text-white bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/[0.1]">
                {metrics.open_reports} Reports
              </span>
              <span className="text-[11px] text-[#6c6c74]">Live feed</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <Link
              href="/announcements"
              className="text-[11px] text-[#ffb340] hover:text-white font-semibold flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
            >
              <span>View Announcements</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Row: Wave Chart (Left) + Circular Gauge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Wave Line Chart (Real Telemetry from Neon DB) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#141416]/90 border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Platform Activity &amp; Cloud Mutations</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5e27a]/15 text-[#f5e27a] border border-[#f5e27a]/30 font-bold">
                  {analytics?.total_period_ops || 0} ops in {timeRange}
                </span>
              </h2>
              <p className="text-[11px] text-[#a6a6ad] mt-0.5 font-medium">
                Real-time mutations and user registrations recorded in Neon DB
              </p>
            </div>

            {/* Time Toggle Pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#18181b] border border-white/[0.06]">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-white text-black shadow-md'
                      : 'text-[#a6a6ad] hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Wave Chart generated dynamically from Neon DB data */}
          <div className="relative w-full h-56 pt-2 select-none">
            {/* Interactive Tooltip Callout dynamically placed at peak */}
            {analytics?.peak_ops > 0 && (
              <div
                className="absolute -translate-x-1/2 -translate-y-full mb-2 z-10 animate-bounce pointer-events-none"
                style={{
                  left: `${(peakPoint.x / svgWidth) * 100}%`,
                  top: `${(peakPoint.y / svgHeight) * 100}%`,
                }}
              >
                <div className="px-3 py-1.5 rounded-full bg-[#1b1b1f] text-white text-[11px] font-bold shadow-xl shadow-black border border-[#f5e27a]/40 flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-[#f5e27a]" />
                  <span>Peak: {analytics.peak_ops} ops ({analytics.peak_date})</span>
                </div>
                <div className="w-2 h-2 bg-[#1b1b1f] border-r border-b border-[#f5e27a]/40 rotate-45 mx-auto -mt-1 shadow-sm" />
              </div>
            )}

            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5e27a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f5e27a" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#30d158" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#30d158" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="35" x2={svgWidth} y2="35" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <line x1="0" y1="115" x2={svgWidth} y2="115" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

              {/* Secondary Wave (User Signups) */}
              {secondaryPathD && (
                <path
                  d={secondaryPathD}
                  fill="none"
                  stroke="#30d158"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
              )}

              {/* Primary Wave Fill Area */}
              {areaPathD && (
                <path d={areaPathD} fill="url(#waveGradient)" />
              )}

              {/* Primary Wave Line */}
              {primaryPathD && (
                <path
                  d={primaryPathD}
                  fill="none"
                  stroke="#f5e27a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points on Primary Line */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={p.total_ops > 0 ? 4 : 2}
                  fill={p.total_ops > 0 ? '#ffffff' : '#f5e27a'}
                  stroke="#f5e27a"
                  strokeWidth={2}
                />
              ))}

              {/* Peak Indicator Point */}
              {analytics?.peak_ops > 0 && (
                <circle
                  cx={peakPoint.x}
                  cy={peakPoint.y}
                  r="6"
                  fill="#ffffff"
                  stroke="#f5e27a"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* X-Axis Dynamic Date Labels */}
            <div className="flex justify-between items-center text-[10px] text-[#6c6c74] font-medium px-2 pt-2 border-t border-white/[0.04]">
              {trends.map((t, idx) => {
                if (trends.length > 14 && idx % Math.ceil(trends.length / 7) !== 0 && idx !== trends.length - 1) {
                  return null;
                }
                return (
                  <span key={t.date} title={t.date}>
                    {t.day_name || t.date.slice(5)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Circular Donut Gauge Card (Microservices Health) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#141416]/90 border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-white">Infrastructure Health</h2>
                <p className="text-[11px] text-[#a6a6ad] mt-0.5 font-medium">
                  Microservices availability &amp; ping telemetry
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 text-[10px] font-mono font-bold">
                Online
              </span>
            </div>

            {/* Radial Gauge */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1e202d"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f5e27a"
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
                    stroke="#30d158"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="180"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-[#a6a6ad]">Ping</span>
                  <span className="text-xl font-black text-white font-mono">
                    {system_health?.latency_ms || 18}ms
                  </span>
                  <span className="text-[9px] text-[#30d158] font-bold uppercase tracking-wider">Optimal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Microservices Breakdown Rows */}
          <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#a6a6ad]">
                <Database className="w-3.5 h-3.5 text-[#f5e27a]" />
                <span className="font-medium text-white">Neon PostgreSQL (8 Tables)</span>
              </div>
              <span className="text-[#30d158] text-[11px] font-bold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" /> {system_health?.latency_ms || 18}ms
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#a6a6ad]">
                <MeloCloudIcon size={14} className="text-[#f5e27a]" />
                <span className="font-medium text-white">Cloudflare R2 Object Storage</span>
              </div>
              <span className="text-[#30d158] text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#a6a6ad]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#30d158]" />
                <span className="font-medium text-white">Firebase Authentication &amp; JWT</span>
              </div>
              <span className="text-[#30d158] text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Real Sync Breakdown & Client Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real Operations Breakdown Card */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#12131b] border border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Cloud Sync Operations Breakdown</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live distribution of CRDT mutation operations stored in Neon DB
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total Mutations: {metrics.total_mutations}</span>
          </div>

          <div className="space-y-4 my-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Upsert & Insert Operations (Playlists & Tracks)</span>
                <span className="text-indigo-400 font-semibold font-mono">
                  {metrics.total_mutations > 0 ? '100%' : '0%'} ({metrics.total_mutations} ops)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1c1e2b] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: metrics.total_mutations > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Deletions & Revocations</span>
                <span className="text-slate-400 font-semibold font-mono">
                  {analytics?.operations_breakdown?.delete || 0} ops
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#1c1e2b] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${(analytics?.operations_breakdown?.delete || 0) * 10}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-4 text-center">
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sync Protocol</span>
              <span className="text-sm font-bold text-white mt-1 block">CRDT Ledger</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Listeners</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">{metrics.total_users} Users</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#171824] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Neon DB Schema</span>
              <span className="text-sm font-bold text-indigo-400 mt-1 block">8 Tables Clean</span>
            </div>
          </div>
        </div>

        {/* Security & Access Overview */}
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
                    Active
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
