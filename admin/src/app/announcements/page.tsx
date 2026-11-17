'use client';

import { useState } from 'react';
import { createAnnouncement, sendPushNotification } from '@/lib/api';

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('info');
  const [saving, setSaving] = useState(false);

  // Instant FCM test state
  const [fcmTitle, setFcmTitle] = useState('Melo Notification');
  const [fcmBody, setFcmBody] = useState('Testing push notifications on local host!');
  const [fcmTarget, setFcmTarget] = useState('announcements');
  const [fcmSending, setFcmSending] = useState(false);

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
      alert('Announcement created and push notification broadcasted to all devices via FCM!');
      setTitle('');
      setBody('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendFCM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcmTitle || !fcmBody) {
      alert('FCM Title and Body are required.');
      return;
    }

    setFcmSending(true);
    try {
      const isToken = fcmTarget.length > 50;
      await sendPushNotification({
        title: fcmTitle,
        body: fcmBody,
        topic: isToken ? undefined : fcmTarget,
        token: isToken ? fcmTarget : undefined,
      });
      alert(`Push notification successfully sent via FCM to ${isToken ? 'Device Token' : `Topic: ${fcmTarget}`}!`);
    } catch (err: any) {
      alert(`FCM Error: ${err.message}`);
    } finally {
      setFcmSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Broadcast Announcements & FCM</h1>
        <p className="text-sm text-gray-400 mt-1">Publish notices to Melo clients and send real-time Firebase push alerts</p>
      </div>

      {/* Main Announcement Broadcast */}
      <form onSubmit={handleSubmit} className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-white">Publish In-App Announcement</h2>
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
            rows={3}
            placeholder="Content shown in app announcement card..."
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#ff3b5c] text-white rounded-lg text-sm font-semibold hover:bg-[#e02f4d] transition-colors"
          >
            {saving ? 'Publishing...' : 'Broadcast Announcement (DB + FCM)'}
          </button>
        </div>
      </form>

      {/* Direct FCM Test Card */}
      <form onSubmit={handleSendFCM} className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Instant FCM Push Notification Test</h2>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">FCM Connected</span>
        </div>
        <p className="text-xs text-gray-400">Send direct push notifications to topic (<code>announcements</code>, <code>all</code>) or a specific device FCM token.</p>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Target (Topic name or Device Token)</label>
          <input
            type="text"
            value={fcmTarget}
            onChange={(e) => setFcmTarget(e.target.value)}
            placeholder="announcements (or paste FCM device token)"
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Push Title</label>
            <input
              type="text"
              value={fcmTitle}
              onChange={(e) => setFcmTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Push Body</label>
            <input
              type="text"
              value={fcmBody}
              onChange={(e) => setFcmBody(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={fcmSending}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            {fcmSending ? 'Sending via FCM...' : 'Send Direct Push Notification'}
          </button>
        </div>
      </form>
    </div>
  );
}
