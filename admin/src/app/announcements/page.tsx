'use client';

import React, { useState } from 'react';
import { createAnnouncement, sendPushNotification } from '@/lib/api';
import {
  Megaphone,
  BellRing,
  Send,
  CheckCircle,
  AlertCircle,
  Radio,
  Sparkles,
} from 'lucide-react';
import { MeloAnnouncementsIcon } from '@/components/MeloIcons';

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState('info');
  const [saving, setSaving] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // FCM Broadcast state
  const [fcmTitle, setFcmTitle] = useState('New Music Drop on Melo!');
  const [fcmBody, setFcmBody] = useState('Explore fresh community playlists and curated tracks.');
  const [fcmTarget, setFcmTarget] = useState('announcements');
  const [fcmSending, setFcmSending] = useState(false);
  const [fcmSuccess, setFcmSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      setError('Title and Body are required.');
      return;
    }

    setSaving(true);
    setError(null);
    setAnnouncementSuccess(false);

    try {
      await createAnnouncement({
        title,
        body,
        severity,
        status: 'published',
      });
      setAnnouncementSuccess(true);
      setTitle('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleSendFCM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcmTitle || !fcmBody) {
      setError('Notification Title and Body are required.');
      return;
    }

    setFcmSending(true);
    setError(null);
    setFcmSuccess(false);

    try {
      const isToken = fcmTarget.length > 50;
      await sendPushNotification({
        title: fcmTitle,
        body: fcmBody,
        topic: isToken ? undefined : fcmTarget,
        token: isToken ? fcmTarget : undefined,
      });
      setFcmSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send FCM push notification');
    } finally {
      setFcmSending(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <MeloAnnouncementsIcon size={22} className="text-[#f5e27a]" />
          <span>Announcements &amp; Push Notifications</span>
        </h1>
        <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
          Broadcast banners to in-app notification center and push alerts via FCM
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: In-App Announcement */}
        <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              <Radio className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Create In-App Banner</h2>
            </div>

            {announcementSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Announcement published to active listeners!</span>
              </div>
            )}

            <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Melo V2 Cloud Sync Live"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="info">Info (Standard Announcement)</option>
                  <option value="warning">Warning (Maintenance Alert)</option>
                  <option value="critical">Critical (Urgent Security Notice)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Announcement Body
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details visible to listeners inside the Melo notifications feed..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Publish Announcement'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: FCM Push Broadcast */}
        <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
              <BellRing className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Broadcast FCM Push Notification</h2>
            </div>

            {fcmSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Push notification sent to Firebase Cloud Messaging!</span>
              </div>
            )}

            <form onSubmit={handleSendFCM} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Notification Title
                </label>
                <input
                  type="text"
                  required
                  value={fcmTitle}
                  onChange={(e) => setFcmTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Topic / Device Token
                </label>
                <input
                  type="text"
                  required
                  placeholder="announcements or direct device FCM token"
                  value={fcmTarget}
                  onChange={(e) => setFcmTarget(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Push Notification Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={fcmBody}
                  onChange={(e) => setFcmBody(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={fcmSending}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{fcmSending ? 'Broadcasting via FCM...' : 'Broadcast FCM Push'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
