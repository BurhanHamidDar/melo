'use client';

import React, { useState, useEffect } from 'react';
import {
  Flag,
  ShieldAlert,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface Report {
  id: string;
  reporter_user_id?: string;
  target_type: 'profile' | 'playlist' | 'announcement' | 'other';
  target_id?: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/v1/admin/reports', {
        headers: {
          Authorization:
            'Bearer ' + (localStorage.getItem('melo_admin_token') || 'dev-test-token'),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setActionLoading(true);
    try {
      await fetch(`http://localhost:8080/v1/admin/reports/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization:
            'Bearer ' + (localStorage.getItem('melo_admin_token') || 'dev-test-token'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, resolution_note: resolutionNote }),
      });
      setActiveReport(null);
      setResolutionNote('');
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-indigo-400" />
            <span>Moderation & Abuse Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Community flags, inappropriate metadata, and user reports queue
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-3.5 py-1.5 rounded-xl bg-[#141620] hover:bg-[#1c1e2b] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center gap-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-[#12131b] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04]">
            <thead className="bg-[#161723]">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Type
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reason & Details
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading moderation reports...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      <span className="font-semibold text-slate-200">Moderation Queue Clear</span>
                      <span className="text-[11px] text-slate-500">No open reports from community listeners.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                        {r.target_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-semibold text-white">{r.reason}</div>
                      {r.details && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.details}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          r.status === 'open'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : r.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-mono text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setActiveReport(r)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-200 transition cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#141620] border border-white/[0.1] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Resolve Community Report</span>
              </h3>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] text-slate-400">Reason:</span>
              <p className="text-xs font-medium text-white">{activeReport.reason}</p>
            </div>

            {activeReport.details && (
              <div>
                <span className="text-[11px] text-slate-400">Details:</span>
                <p className="text-xs text-slate-300">{activeReport.details}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Moderator Resolution Note
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Audit notes on why this was resolved or dismissed..."
                className="w-full px-3 py-2 bg-[#0e0f15] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => updateStatus(activeReport.id, 'dismissed')}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => updateStatus(activeReport.id, 'resolved')}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white shadow-md transition"
              >
                Resolve & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
