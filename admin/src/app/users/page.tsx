'use client';

import React, { useEffect, useState } from 'react';
import { getUsers, updateUserStatus, UserRecord } from '@/lib/api';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle,
  Clock,
  MoreVertical,
  X,
  UserCheck,
  Ban,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { MeloUsersIcon, MeloSearchIcon } from '@/components/MeloIcons';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [reason, setReason] = useState('');
  const [newStatus, setNewStatus] = useState('suspended');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    getUsers(query)
      .then((res) => setUsers(res.users || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !reason.trim()) {
      alert('A valid reason is mandatory for any administrative moderation action.');
      return;
    }
    setSubmitting(true);
    try {
      await updateUserStatus(selectedUser.id, newStatus, reason.trim());
      setSelectedUser(null);
      setReason('');
      loadUsers();
    } catch (e: any) {
      alert(e.message || 'Failed to update user status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MeloUsersIcon size={22} className="text-[#f5e27a]" />
            <span>User Management &amp; Cloud Sync</span>
          </h1>
          <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
            Registered Melo listeners, sync mutations, and account status controls
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a6a6ad]">
              <MeloSearchIcon size={14} />
            </div>
            <input
              type="text"
              placeholder="Search username or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full pl-9 pr-3.5 py-2 bg-[#18181b] border border-white/[0.08] rounded-full text-xs text-white placeholder-[#6c6c74] focus:outline-none focus:ring-2 focus:ring-[#f5e27a]/30 focus:border-[#f5e27a]/50 transition-all"
            />
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-white hover:bg-[#e6e6e6] text-black rounded-full text-xs font-bold shadow-md shadow-white/10 transition cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#141416]/90 border border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.04]">
            <thead className="bg-[#161723]">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Firebase UID
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading registered listeners...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActive = u.account_status === 'active';
                  const isSuspended = u.account_status === 'suspended';
                  const initials = (u.display_name || u.email || 'User').slice(0, 2).toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* User Cell */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600/40 to-violet-600/40 border border-white/[0.08] flex items-center justify-center font-bold text-xs text-indigo-300">
                            {initials}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {u.display_name || u.username || 'Anonymous Listener'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {u.email || 'No email attached'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* UID */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[11px] font-mono text-slate-400">
                        {u.firebase_uid}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isSuspended
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>

                      {/* Visibility */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-300 capitalize">
                        {u.profile_visibility}
                      </td>

                      {/* Created */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewStatus(isActive ? 'suspended' : 'active');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-200 transition cursor-pointer"
                        >
                          Moderate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#141620] border border-white/[0.1] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Account Moderation</span>
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusChange} className="mt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-400">Target User:</span>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {selectedUser.email || selectedUser.firebase_uid}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e0f15] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="active">Active (Restore Normal Access)</option>
                  <option value="suspended">Suspended (Prevent Login & Sync)</option>
                  <option value="banned">Banned (Permanent Restriction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mandatory Audit Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State clear operational reason for audit logging..."
                  className="w-full px-3 py-2 bg-[#0e0f15] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Applying...' : 'Apply Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
