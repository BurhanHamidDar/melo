'use client';

import React, { useState } from 'react';
import { createRelease } from '@/lib/api';
import {
  Smartphone,
  UploadCloud,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Clock,
  Lock,
  Sparkles,
  Layers,
  Calendar,
  Cloud,
} from 'lucide-react';

export default function ReleasesPage() {
  const [channel, setChannel] = useState('stable');
  const [versionCode, setVersionCode] = useState('14');
  const [versionName, setVersionName] = useState('2.0.0');
  const [minSupported, setMinSupported] = useState('12');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [r2ObjectKey, setR2ObjectKey] = useState('');
  const [sha256, setSha256] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [isLandingPrimary, setIsLandingPrimary] = useState(true);

  // Release Timing: 'immediate' | 'scheduled'
  const [timingMode, setTimingMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionCode || !versionName || !sha256) {
      setError('Version Code, Version Name, and SHA-256 are mandatory.');
      return;
    }

    if (timingMode === 'scheduled' && !scheduledAt) {
      setError('Please select a target release date and time for the scheduled countdown.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const scheduledIso = timingMode === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null;

      await createRelease({
        channel,
        version_code: parseInt(versionCode, 10),
        version_name: versionName,
        min_supported_version_code: parseInt(minSupported, 10) || 12,
        download_url: downloadUrl || 'https://github.com/BurhanHamidDar/melo/releases/latest',
        r2_object_key: r2ObjectKey ? r2ObjectKey.trim() : null,
        sha256,
        file_size_bytes: 51389458,
        release_notes: releaseNotes || 'Melo V2 Release: Cloud Sync, synchronized lyrics, and unbypassable release system.',
        mandatory,
        status: 'published',
        is_landing_primary: isLandingPrimary,
        scheduled_release_at: scheduledIso,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to publish release');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <span>App Release Distribution & Countdown Scheduler</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Publish live APK versions or schedule unbypassable countdown drops for the landing page and app clients
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            Release v{versionName} ({channel}) successfully saved! {timingMode === 'scheduled' ? `Locked with server-side countdown until ${scheduledAt}` : 'Available for immediate download.'}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-6 shadow-sm"
      >
        {/* Release Mode Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-200 block mb-2">
            Release Mode & Deployment Policy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTimingMode('immediate')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                timingMode === 'immediate'
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                  : 'bg-[#171822] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Sparkles className={`w-5 h-5 mt-0.5 ${timingMode === 'immediate' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-white">Instant Release</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Downloads are immediately available to the public on the landing page and via in-app updates.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTimingMode('scheduled')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                timingMode === 'scheduled'
                  ? 'bg-violet-600/15 border-violet-500/50 text-white'
                  : 'bg-[#171822] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Clock className={`w-5 h-5 mt-0.5 ${timingMode === 'scheduled' ? 'text-violet-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-semibold text-white">Scheduled Countdown (Anti-Bypass)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Displays live countdown timer on landing page. API enforces HTTP 403 and omits download links until release time.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Scheduled Date/Time Picker */}
        {timingMode === 'scheduled' && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/25 space-y-3">
            <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
              <Lock className="w-4 h-4 text-violet-400" />
              <span>Configure Target Launch Date & Time (UTC/Local)</span>
            </div>
            <div>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#171822] border border-violet-500/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
            <p className="text-[11px] text-violet-200/80 leading-relaxed">
              🛡️ <b>Anti-Bypass Protection Enabled:</b> Until this timestamp expires, the server strictly withholds binary URLs and drops direct download attempts with HTTP 403 Forbidden.
            </p>
          </div>
        )}

        {/* Basic Release Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Distribution Track
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="stable">Stable (Production Track)</option>
              <option value="beta">Beta (Preview Track)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Version Code (Integer)
            </label>
            <input
              type="number"
              required
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Display Version Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2.0.0"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Min Supported Version Code
            </label>
            <input
              type="number"
              value={minSupported}
              onChange={(e) => setMinSupported(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Binary Distribution Storage Options */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cloudflare R2 Object Key (Recommended for Zero-Egress Storage)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. releases/melo-v2.0.0.apk"
              value={r2ObjectKey}
              onChange={(e) => setR2ObjectKey(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If provided, the Go backend generates secure 15-minute presigned GET URLs from your private R2 bucket once unlocked.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Fallback / Direct APK Download URL
            </label>
            <input
              type="url"
              placeholder="https://github.com/BurhanHamidDar/melo/releases/download/.../melo-universal.apk"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            SHA-256 Checksum (Integrity Verification)
          </label>
          <input
            type="text"
            required
            placeholder="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            value={sha256}
            onChange={(e) => setSha256(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Release Notes (Markdown supported)
          </label>
          <textarea
            rows={4}
            placeholder="- Support real-time Cloud Sync&#10;- Free zero-dollar share link redirection&#10;- Improved player UI"
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Feature Switches */}
        <div className="space-y-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="landing-primary-check"
              checked={isLandingPrimary}
              onChange={(e) => setIsLandingPrimary(e.target.checked)}
              className="rounded border-white/[0.1] bg-[#171822] text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="landing-primary-check" className="text-xs text-slate-200 cursor-pointer">
              <b>Promote to Landing Page Download:</b> Features this version as the primary hero button download on the landing page.
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="mandatory-check"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
              className="rounded border-white/[0.1] bg-[#171822] text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="mandatory-check" className="text-xs text-slate-300 cursor-pointer">
              Mandatory Update (Forces existing listeners to update before app launch)
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{saving ? 'Publishing Release...' : timingMode === 'scheduled' ? 'Schedule Countdown Release' : 'Publish APK Release Immediately'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
