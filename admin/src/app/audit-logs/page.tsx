'use client';

import React, { useEffect, useState } from 'react';
import { getAuditLogs, AuditLog } from '@/lib/api';
import {
  ShieldCheck,
  Clock,
  Activity,
  User,
  Key,
  RefreshCw,
} from 'lucide-react';
import { MeloAuditIcon } from '@/components/MeloIcons';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = () => {
    setLoading(true);
    getAuditLogs()
      .then((res) => setLogs(res.audit_logs || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MeloAuditIcon size={22} className="text-[#f5e27a]" />
            <span>Administrator Audit Ledger</span>
          </h1>
          <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
            Immutable cryptographic ledger of all privileged administrator operations in Neon DB
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 rounded-full bg-[#18181b] hover:bg-[#232327] border border-white/[0.08] text-xs font-semibold text-[#a6a6ad] hover:text-white flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f5e27a]' : 'text-[#f5e27a]'}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#141416]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04]">
            <thead className="bg-[#161723]">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Action Event
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Type
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target ID
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Operational Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Reading audit records from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ShieldCheck className="w-6 h-6 text-indigo-400" />
                      <span className="font-semibold text-slate-200">No Privileged Changes Recorded Yet</span>
                      <span className="text-[11px] text-slate-500">
                        Actions like releasing updates or user suspensions will populate here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-white px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-300 capitalize">
                      {log.target_type || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-mono text-slate-400">
                      {log.target_id ? log.target_id.slice(0, 12) + '...' : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      {log.reason || 'Standard administrative operation'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
