'use client';

import { useEffect, useState } from 'react';
import { getOverview, OverviewResponse } from '@/lib/api';

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOverview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading system overview metrics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800 rounded-xl text-red-200">
        Failed to load overview: {error}
      </div>
    );
  }

  const { metrics, system_health } = data;

  const cards = [
    { label: 'Total Registered Users', value: metrics.total_users, subtext: 'Registered listeners' },
    { label: 'Active Users (30d)', value: metrics.active_users_30d, subtext: 'Engaged listeners' },
    { label: 'Public Playlists', value: metrics.public_playlists, subtext: 'Community curated' },
    { label: 'Suspended Users', value: metrics.suspended_users, subtext: 'Restricted accounts' },
    { label: 'Open Reports', value: metrics.open_reports, subtext: 'Awaiting moderation' },
    { label: 'Active Announcements', value: metrics.active_announcements, subtext: 'Published banners' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
        <p className="text-sm text-gray-400 mt-1">Live metrics from Go REST API and Neon PostgreSQL database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c) => (
          <div key={c.label} className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl shadow-sm">
            <p className="text-sm font-medium text-gray-400">{c.label}</p>
            <p className="text-3xl font-extrabold text-white mt-2">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl">
          <h2 className="text-base font-semibold text-white mb-4">Release Channels</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#262b36]">
              <span className="text-sm text-gray-300">Current Stable Version</span>
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                v{metrics.current_stable}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-300">Current Beta Track</span>
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                v{metrics.current_beta}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl">
          <h2 className="text-base font-semibold text-white mb-4">Service Infrastructure Health</h2>
          <div className="space-y-3">
            {Object.entries(system_health).map(([service, status]) => (
              <div key={service} className="flex justify-between items-center py-2 border-b border-[#262b36] last:border-0">
                <span className="text-sm capitalize text-gray-300">{service} Service</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 uppercase">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
