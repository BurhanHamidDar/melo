'use client';

import React, { useState } from 'react';
import { createRelease } from '@/lib/api';
import {
  Smartphone,
  UploadCloud,
  CheckCircle,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Hash,
  ExternalLink,
} from 'lucide-react';

export default function ReleasesPage() {
  const [channel, setChannel] = useState('stable');
  const [versionCode, setVersionCode] = useState('13');
  const [versionName, setVersionName] = useState('2.0.0');
  const [minSupported, setMinSupported] = useState('12');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sha256, setSha256] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionCode || !versionName || !sha256) {
      setError('Version Code, Version Name, and SHA-256 are mandatory.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await createRelease({
        channel,
        version_code: parseInt(versionCode, 10),
        version_name: versionName,
        min_supported_version_code: parseInt(minSupported, 10) || 12,
        download_url: downloadUrl || 'https://github.com/vaxad/Melo/releases/download/v2.0.0/melo-debug.apk',
        sha256,
        file_size_bytes: 51389458,
        release_notes: releaseNotes || 'Melo V2 Cloud Sync, modern player UI, and free deep-linking release.',
        mandatory,
        status: 'published',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to publish release');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <span>App Release Distribution</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Publish and roll out APK builds to Stable and Beta update channels
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Release v{versionName} ({channel}) successfully published to Neon DB!</span>
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
        className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-5 shadow-sm"
      >
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
              <option value="stable">Stable (Production Users)</option>
              <option value="beta">Beta (Early Preview Testers)</option>
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

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Direct APK Download URL
          </label>
          <input
            type="url"
            placeholder="https://github.com/vaxad/Melo/releases/download/.../melo-debug.apk"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            SHA-256 Checksum
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

        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="mandatory-check"
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
            className="rounded border-white/[0.1] bg-[#171822] text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="mandatory-check" className="text-xs text-slate-300 cursor-pointer">
            Mandatory Update (Forces listeners to update before app launch)
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{saving ? 'Publishing Release...' : 'Publish APK Release'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
