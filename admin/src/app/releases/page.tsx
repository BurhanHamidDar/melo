'use client';

import { useState } from 'react';
import { createRelease } from '@/lib/api';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionCode || !versionName || !sha256) {
      alert('Version Code, Version Name, and SHA-256 are required.');
      return;
    }

    setSaving(true);
    try {
      await createRelease({
        channel,
        version_code: parseInt(versionCode, 10),
        version_name: versionName,
        min_supported_version_code: parseInt(minSupported, 10) || 12,
        download_url: downloadUrl,
        sha256,
        file_size_bytes: 51389458,
        release_notes: releaseNotes,
        mandatory,
        status: 'published',
      });
      alert('Release published successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">App Release Management</h1>
        <p className="text-sm text-gray-400 mt-1">Publish controlled APK updates to Stable and Beta channels</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-[#161a22] border border-[#262b36] rounded-xl space-y-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Release Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            >
              <option value="stable">Stable</option>
              <option value="beta">Beta</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Version Code (Authoritative)</label>
            <input
              type="number"
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Version Name</label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="e.g. 2.0.0"
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Min Supported Version Code</label>
            <input
              type="number"
              value={minSupported}
              onChange={(e) => setMinSupported(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">APK SHA-256 Checksum (Cryptographic Integrity)</label>
          <input
            type="text"
            value={sha256}
            onChange={(e) => setSha256(e.target.value)}
            placeholder="64-character hex hash"
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm font-mono text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Download URL</label>
          <input
            type="url"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">Release Notes</label>
          <textarea
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            rows={4}
            placeholder="Changelog details presented to Android users..."
            className="w-full px-3.5 py-2 bg-[#0d0f12] border border-[#262b36] rounded-lg text-sm text-white"
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="mandatory"
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
            className="rounded border-[#262b36] bg-[#0d0f12] text-[#ff3b5c]"
          />
          <label htmlFor="mandatory" className="text-sm text-gray-300">
            Mandatory update (Blocks older versions below min supported code)
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#ff3b5c] text-white rounded-lg text-sm font-semibold hover:bg-[#e02f4d] transition-colors"
          >
            {saving ? 'Publishing...' : 'Publish Release'}
          </button>
        </div>
      </form>
    </div>
  );
}
