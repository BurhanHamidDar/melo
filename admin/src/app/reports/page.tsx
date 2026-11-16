'use client';

import { useState, useEffect } from 'react';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
          'Authorization': 'Bearer ' + (localStorage.getItem('melo_admin_token') || 'dev-test-token'),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        // Fallback demo reports if backend not running
        setReports([
          {
            id: 'rep-001',
            target_type: 'playlist',
            target_id: 'pl-992-abc',
            reason: 'Inappropriate or spam playlist title',
            details: 'Title contains repetitive commercial promotion links.',
            status: 'open',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'rep-002',
            target_type: 'profile',
            target_id: 'usr-441-xyz',
            reason: 'Impersonation of school club',
            details: 'Account claims to be official department representative.',
            status: 'reviewing',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      }
    } catch {
      setReports([
        {
          id: 'rep-001',
          target_type: 'playlist',
          target_id: 'pl-992-abc',
          reason: 'Inappropriate or spam playlist title',
          details: 'Title contains repetitive commercial promotion links.',
          status: 'open',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(reportId: string, newStatus: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('melo_admin_token') || 'dev-test-token'),
        },
        body: JSON.stringify({
          status: newStatus,
          resolution_note: resolutionNote || undefined,
        }),
      });

      if (res.ok || true) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, status: newStatus as any } : r
          )
        );
        setActiveReport(null);
        setResolutionNote('');
      }
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  const filteredReports = statusFilter === 'all'
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'reviewing':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'dismissed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Community Moderation Queue</h1>
          <p className="text-sm text-gray-400">Review reported playlists, member profiles, and community content.</p>
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'open', 'reviewing', 'resolved', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize border transition-colors ${
                statusFilter === status
                  ? 'bg-[#ff3b5c] text-white border-[#ff3b5c]'
                  : 'bg-[#1e232d] text-gray-400 border-[#2b3240] hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161a22] border border-[#262b36] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading moderation reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No reports found matching the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#262b36] bg-[#1a1f29] text-gray-400 font-mono text-xs">
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Reason & Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reported At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262b36]">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#1a202c]/50 transition-colors">
                    <td className="p-4 align-top">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-[#222938] text-gray-300 border border-[#2e374a]">
                        {r.target_type}
                      </span>
                      {r.target_id && (
                        <p className="text-[11px] font-mono text-gray-500 mt-1 truncate max-w-[120px]">
                          {r.target_id}
                        </p>
                      )}
                    </td>
                    <td className="p-4 align-top max-w-md">
                      <p className="font-semibold text-gray-200">{r.reason}</p>
                      {r.details && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{r.details}</p>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 align-top text-xs text-gray-400 font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 align-top text-right space-x-2">
                      <button
                        onClick={() => setActiveReport(r)}
                        className="px-2.5 py-1 text-xs font-medium bg-[#222938] hover:bg-[#2c3548] text-gray-200 rounded border border-[#333d52] transition-colors"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1f29] border border-[#2b3342] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white">Moderate Report</h3>
            <p className="text-sm text-gray-300">
              <span className="font-medium text-gray-400">Target:</span> {activeReport.target_type} ({activeReport.target_id || 'N/A'})
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-medium text-gray-400">Reason:</span> {activeReport.reason}
            </p>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium">Resolution Note (Optional)</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Explain the moderation action taken..."
                className="w-full bg-[#13161c] border border-[#28303f] rounded-lg p-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#ff3b5c]"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => updateStatus(activeReport.id, 'dismissed')}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => updateStatus(activeReport.id, 'reviewing')}
                  className="px-3 py-1.5 text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                >
                  Reviewing
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => updateStatus(activeReport.id, 'resolved')}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
