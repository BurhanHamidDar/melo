'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs, AuditLog } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then((res) => setLogs(res.audit_logs))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Administrator Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-1">Immutable record of all privileged administrative modifications</p>
      </div>

      <div className="bg-[#161a22] border border-[#262b36] rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[#262b36]">
          <thead className="bg-[#1c212b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Target Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Target ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262b36]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Loading audit records...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No audit log records yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1a1f29] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 capitalize">
                    {log.target_type || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-400">
                    {log.target_id ? log.target_id.slice(0, 8) + '...' : '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-300">
                    {log.reason || 'None specified'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
