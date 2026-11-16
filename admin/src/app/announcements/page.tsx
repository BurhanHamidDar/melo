'use client';

import { useState } from 'react';
import { createAnnouncement } from '@/lib/api';

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('info');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      alert('Title and Body are required.');
      return;
    }

    setSaving(true);
    try {
      await createAnnouncement({
        title,
        body,
        severity,
        status: 'published',
      });
      alert('Announcement created and broadcasted!');
      setTitle('');
      setBody('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Broadcast Announcements</h1>
        <p className="text-sm text-gray-400 mt-1">Publish notices and alerts to all active Melo clients</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Announcement Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Server Maintenance or New Features"
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Severity Level</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          >
            <option value="info">Info</option>
            <option value="important">Important</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Content shown in app announcement card..."
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#ff3b5c] text-white rounded-lg text-sm font-semibold hover:bg-[#e02f4d] transition-colors"
          >
            {saving ? 'Publishing...' : 'Broadcast Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}
