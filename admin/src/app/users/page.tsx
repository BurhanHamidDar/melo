'use client';

import { useEffect, useState } from 'react';
import { getUsers, updateUserStatus, UserRecord } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [reason, setReason] = useState('');
  const [newStatus, setNewStatus] = useState('suspended');

  const loadUsers = () => {
    setLoading(true);
    getUsers(query)
      .then((res) => setUsers(res.users))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusChange = async () => {
    if (!selectedUser || !reason) {
      alert('A reason is mandatory for any status change');
      return;
    }
    try {
      await updateUserStatus(selectedUser.id, newStatus, reason);
      alert('User status updated');
      setSelectedUser(null);
      setReason('');
      loadUsers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Search, inspect and moderate Melo listeners</p>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search username or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3.5 py-2 bg-[#161a22] border border-[#262b36] rounded-lg text-sm text-white focus:outline-none focus:border-[#ff3b5c]"
          />
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-[#ff3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#e02f4d]"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-[#161a22] border border-[#262b36] rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[#262b36]">
          <thead className="bg-[#1c212b]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Firebase UID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Visibility</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262b36]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#1a1f29] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{u.display_name || u.username || 'Anonymous'}</div>
                    <div className="text-xs text-gray-400">{u.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">{u.firebase_uid.slice(0, 12)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      u.account_status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {u.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 capitalize">{u.profile_visibility}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="text-xs font-medium text-[#ff3b5c] hover:underline"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161a22] border border-[#262b36] rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Moderate User: {selectedUser.username || selectedUser.id}</h3>
            
            <div>
              <label className="text-xs text-gray-400 block mb-1">New Account Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Reason for Action (Mandatory)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Reason recorded in audit logs..."
                className="w-full px-3 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 bg-[#ff3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#e02f4d]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
