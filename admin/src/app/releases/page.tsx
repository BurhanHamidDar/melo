'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createRelease, getReleases, unlockRelease, toggleReleaseMandatory, uploadReleaseAPK, AppRelease } from '@/lib/api';
import {
  Smartphone,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Clock,
  Lock,
  Sparkles,
  Cloud,
  Unlock,
  Radio,
  RefreshCw,
  Globe,
  FileCheck,
  Loader2,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  Info,
} from 'lucide-react';
import {
  MeloLogo,
  MeloMark,
  MeloReleasesIcon,
  MeloCloudIcon,
  MeloDownloadIcon,
  MeloGlobeIcon,
} from '@/components/MeloIcons';

export default function ReleasesPage() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);

  // Active release being edited
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [isNewReleaseMode, setIsNewReleaseMode] = useState(false);

  // APK Upload state
  const [uploadingAPK, setUploadingAPK] = useState(false);
  const [uploadedFileNotice, setUploadedFileNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [channel, setChannel] = useState('stable');
  const [versionCode, setVersionCode] = useState('');
  const [versionName, setVersionName] = useState('');
  const [minSupported, setMinSupported] = useState('12');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [r2ObjectKey, setR2ObjectKey] = useState('');
  const [sha256, setSha256] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(51389458);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [isLandingPrimary, setIsLandingPrimary] = useState(true);

  // Release Timing: 'immediate' | 'scheduled'
  const [timingMode, setTimingMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState('');

  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timeZoneName, setTimeZoneName] = useState('');

  useEffect(() => {
    try {
      setTimeZoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time');
    } catch {
      setTimeZoneName('Local Time');
    }
    loadReleases();
  }, []);

  const loadReleases = async (preferredId?: string) => {
    setLoadingReleases(true);
    try {
      const data = await getReleases();
      if (data && data.releases) {
        setReleases(data.releases);

        // Auto-populate the form with the preferred, primary, or latest release from DB
        // so refreshing the page NEVER reverts the form to dummy defaults!
        if (data.releases.length > 0 && !isNewReleaseMode) {
          const target = (preferredId ? data.releases.find((r: AppRelease) => r.id === preferredId) : null)
            || (selectedReleaseId ? data.releases.find((r: AppRelease) => r.id === selectedReleaseId) : null)
            || data.releases.find((r: AppRelease) => r.is_landing_primary)
            || data.releases[0];

          if (target) {
            populateForm(target);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load releases', err);
    } finally {
      setLoadingReleases(false);
    }
  };

  const populateForm = (rel: AppRelease) => {
    setSelectedReleaseId(rel.id);
    setIsNewReleaseMode(false);
    setChannel(rel.channel || 'stable');
    setVersionCode(String(rel.version_code));
    setVersionName(rel.version_name);
    setMinSupported(String(rel.min_supported_version_code || 12));
    setDownloadUrl(rel.download_url || '');
    setR2ObjectKey(rel.r2_object_key || '');
    setSha256(rel.sha256 || '');
    setFileSizeBytes(rel.file_size_bytes || 51389458);
    setReleaseNotes(rel.release_notes || '');
    setMandatory(rel.mandatory === true);
    setIsLandingPrimary(rel.is_landing_primary ?? false);

    if (rel.scheduled_release_at) {
      setTimingMode('scheduled');
      const d = new Date(rel.scheduled_release_at);
      const pad = (n: number) => String(n).padStart(2, '0');
      const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setScheduledAt(localStr);
    } else {
      setTimingMode('immediate');
      setScheduledAt('');
    }
  };

  const handleNewRelease = () => {
    setSelectedReleaseId(null);
    setIsNewReleaseMode(true);
    setVersionCode('');
    setVersionName('');
    setMinSupported('12');
    setDownloadUrl('');
    setR2ObjectKey('');
    setSha256('');
    setFileSizeBytes(51389458);
    setReleaseNotes('');
    setMandatory(false);
    setIsLandingPrimary(true);
    setTimingMode('immediate');
    setScheduledAt('');
    setUploadedFileNotice(null);
    setError(null);
    setSuccess(null);
  };

  const handleToggleMandatory = async (id: string, name: string) => {
    setActionLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await toggleReleaseMandatory(id);
      const policyName = res.mandatory ? 'Mandatory (Force Update)' : 'Optional Update';
      setSuccess(`Release ${name} policy updated to: ${policyName}`);

      // Update in table list immediately
      setReleases((prev) =>
        prev.map((r) => (r.id === id ? { ...r, mandatory: res.mandatory } : r))
      );

      // If this release is currently open in the form, sync its toggle
      if (selectedReleaseId === id) {
        setMandatory(res.mandatory);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle policy');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickUnlock = async (id: string, name: string) => {
    setActionLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      await unlockRelease(id);
      setSuccess(`Release ${name} unlocked! It is now live and downloadable immediately.`);
      await loadReleases(id);
    } catch (err: any) {
      setError(err.message || 'Failed to unlock release');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSelectRelease = (rel: AppRelease) => {
    populateForm(rel);
    setError(null);
    setSuccess(`Editing release v${rel.version_name} (Build ${rel.version_code})`);
  };

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setError('Please select a valid Android package file (.apk)');
      return;
    }

    setUploadingAPK(true);
    setError(null);
    setUploadedFileNotice(null);

    try {
      const data = await uploadReleaseAPK(file);
      if (data && data.success) {
        setDownloadUrl(data.download_url);
        setR2ObjectKey(data.r2_object_key);
        setSha256(data.sha256);
        setFileSizeBytes(data.file_size_bytes);

        const sizeMB = (data.file_size_bytes / (1024 * 1024)).toFixed(1);
        setUploadedFileNotice(`Successfully uploaded ${data.filename} (${sizeMB} MB). Download URL and SHA-256 automatically assigned.`);

        // Try to parse version info from filename (e.g. melo-v2.0.2.apk)
        const match = data.filename.match(/v?(\d+\.\d+(\.\d+)?)/i);
        if (match && match[1]) {
          setVersionName(match[1]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload APK to server');
    } finally {
      setUploadingAPK(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionCode || !versionName || !sha256) {
      setError('Version Code, Version Name, and SHA-256 are mandatory.');
      return;
    }

    if (!downloadUrl && !r2ObjectKey) {
      setError('Please upload an APK file or specify a download URL.');
      return;
    }

    if (timingMode === 'scheduled' && !scheduledAt) {
      setError('Please select a target release date and time for the scheduled countdown.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const scheduledIso = timingMode === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null;

      const saved = await createRelease({
        channel,
        version_code: parseInt(versionCode, 10),
        version_name: versionName,
        min_supported_version_code: parseInt(minSupported, 10) || 12,
        download_url: downloadUrl || `/v1/releases/download?channel=${channel}`,
        r2_object_key: r2ObjectKey ? r2ObjectKey.trim() : null,
        sha256,
        file_size_bytes: fileSizeBytes,
        release_notes: releaseNotes || 'Melo V2 Release: Cloud Sync, synchronized lyrics, and unbypassable release system.',
        mandatory,
        status: 'published',
        is_landing_primary: isLandingPrimary,
        scheduled_release_at: scheduledIso,
      });

      setSelectedReleaseId(saved.id);
      setIsNewReleaseMode(false);
      setSuccess(
        `Release v${versionName} (Build ${versionCode}) saved successfully as ${mandatory ? 'MANDATORY (Force Update)' : 'OPTIONAL Update'}! ${
          timingMode === 'scheduled'
            ? `Countdown active until ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${timeZoneName}).`
            : 'Live now for immediate download.'
        }`
      );

      await loadReleases(saved.id);
    } catch (err: any) {
      setError(err.message || 'Failed to publish release');
    } finally {
      setSaving(false);
    }
  };

  const scheduledRelease = releases.find((r) => r.scheduled_release_at && new Date(r.scheduled_release_at) > new Date());

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MeloReleasesIcon size={22} className="text-[#f5e27a]" />
            <span>App Release Distribution &amp; Direct APK Uploader</span>
          </h1>
          <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
            Upload new APK binaries directly and schedule unbypassable countdown drops or immediate rollouts
          </p>
        </div>

        <button
          onClick={() => loadReleases()}
          disabled={loadingReleases}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#18181b] hover:bg-[#232327] text-xs font-semibold text-[#a6a6ad] hover:text-white border border-white/[0.08] transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#f5e27a] ${loadingReleases ? 'animate-spin' : ''}`} />
          <span>Refresh Releases</span>
        </button>
      </div>

      {/* Active Scheduled Release Alert Card */}
      {scheduledRelease && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/60 via-[#18152e] to-[#12131f] border border-violet-500/30 space-y-3 shadow-lg shadow-violet-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Active Countdown Locked on Landing Page
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono border border-violet-500/30">
              v{scheduledRelease.version_name} (Build {scheduledRelease.version_code})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>
                  Target Unlock: {new Date(scheduledRelease.scheduled_release_at!).toLocaleDateString()} at{' '}
                  {new Date(scheduledRelease.scheduled_release_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  <span className="text-xs text-slate-400 font-normal">({timeZoneName})</span>
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Landing page shows an unbypassable countdown timer. Direct downloads return HTTP 403 until this time.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectRelease(scheduledRelease)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-slate-200 transition cursor-pointer"
              >
                Reschedule Time
              </button>

              <button
                type="button"
                disabled={actionLoadingId === scheduledRelease.id}
                onClick={() => handleQuickUnlock(scheduledRelease.id, scheduledRelease.version_name)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{actionLoadingId === scheduledRelease.id ? 'Unlocking...' : 'Unlock Now (Go Live)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Release Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-6 shadow-sm"
      >
        {/* Form Title & Contextual Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {selectedReleaseId ? `Editing Release v${versionName || '...'}` : 'Create / Upload New App Release'}
              </h2>
              {selectedReleaseId && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    mandatory
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {mandatory ? 'Mandatory Update' : 'Optional Update'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selectedReleaseId
                ? `Editing Build ${versionCode || '?'}. Changes will update this release in the database.`
                : 'Upload an APK or specify release metadata to publish a new version.'}
            </p>
          </div>

          {selectedReleaseId && (
            <button
              type="button"
              onClick={handleNewRelease}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-slate-200 border border-white/[0.08] transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Create New Version</span>
            </button>
          )}
        </div>

        {/* Direct APK Upload Dropzone */}
        <div>
          <label className="text-xs font-semibold text-slate-200 block mb-2 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Direct APK Upload (Automatic URL & SHA-256 Calculation)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                : 'border-white/[0.12] hover:border-indigo-400/50 bg-[#171822]/70 hover:bg-[#171822]'
            }`}
          >
            {uploadingAPK ? (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs font-medium text-white">Uploading APK binary & calculating SHA-256 hash...</p>
                <p className="text-[11px] text-slate-400">Please wait while the server processes the package.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1">
                  <FileCode className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-white">
                  Drop your Android <code className="text-indigo-300">.apk</code> file here, or <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-slate-400 max-w-md">
                  Upload directly from your device. The server will automatically compute the file size, SHA-256 checksum, and assign the download route.
                </p>
              </div>
            )}
          </div>

          {uploadedFileNotice && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{uploadedFileNotice}</span>
            </div>
          )}
        </div>

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
                  Downloads are immediately available to the public on the landing page.
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
                  Displays live countdown timer on landing page. API enforces HTTP 403 until release time.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Scheduled Date/Time Picker */}
        {timingMode === 'scheduled' && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-300 text-xs font-semibold">
                <Lock className="w-4 h-4 text-violet-400" />
                <span>Target Launch Date & Time ({timeZoneName})</span>
              </div>
              <span className="text-[10px] text-violet-300/80">Local Browser Time</span>
            </div>
            <div>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#171822] border border-violet-500/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-violet-200/80 leading-relaxed">
              <b>Anti-Bypass Protection:</b> The server withholds binary links and rejects downloads with HTTP 403 Forbidden until this exact moment in UTC.
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
              Version Code (Integer ID)
            </label>
            <input
              type="number"
              required
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
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
              placeholder="e.g. 2.0.1"
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
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Assigned Download Route & SHA-256 (Automatically Filled) */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Download URL / Server File Route (Auto-Populated)</span>
              {downloadUrl && <span className="text-[10px] text-emerald-400 font-medium">Ready</span>}
            </label>
            <input
              type="text"
              required
              placeholder="Automatically populated upon APK upload or enter URL"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>SHA-256 Checksum (Auto-Populated)</span>
              {sha256 && <span className="text-[10px] text-emerald-400 font-medium">Computed</span>}
            </label>
            <input
              type="text"
              required
              placeholder="Automatically computed upon APK upload"
              value={sha256}
              onChange={(e) => setSha256(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Release Notes
          </label>
          <textarea
            rows={3}
            placeholder="- Support real-time Cloud Sync&#10;- Free zero-dollar share link redirection"
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Update Prompt Policy (Optional vs Mandatory) */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <label className="text-xs font-semibold text-slate-300 block">
            In-App Update Prompt Policy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMandatory(false);
                setMinSupported('1');
              }}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                !mandatory
                  ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-sm shadow-blue-500/10'
                  : 'bg-[#171822] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Info className={`w-5 h-5 mt-0.5 ${!mandatory ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Optional Update (Standard)</p>
                  {!mandatory && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Shows on the Home screen with "Update Now" and "Skip for Now" buttons. Users can dismiss it for the session.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMandatory(true);
                if (versionCode) setMinSupported(versionCode);
              }}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                mandatory
                  ? 'bg-rose-600/15 border-rose-500/50 text-white shadow-sm shadow-rose-500/10'
                  : 'bg-[#171822] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <ShieldAlert className={`w-5 h-5 mt-0.5 ${mandatory ? 'text-rose-400' : 'text-slate-500'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Mandatory (Force Update)</p>
                  {mandatory && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Completely blocks the app everywhere. Disables back-button bypass and omits the skip button until updated.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Primary Landing Page Switch */}
        <div className="pt-2">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="landing-primary-check"
              checked={isLandingPrimary}
              onChange={(e) => setIsLandingPrimary(e.target.checked)}
              className="rounded border-white/[0.1] bg-[#171822] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="landing-primary-check" className="text-xs text-slate-200 cursor-pointer">
              <b>Promote as Primary Landing Page Release:</b> Serves this version directly to visitor downloads on the landing page.
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploadingAPK}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{saving ? 'Saving / Rescheduling...' : timingMode === 'scheduled' ? 'Save & Schedule Countdown Release' : 'Save & Publish Immediately'}</span>
          </button>
        </div>
      </form>

      {/* Existing Releases Table */}
      <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Release Registry ({releases.length})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Version</th>
                <th className="py-2.5 px-3">Track</th>
                <th className="py-2.5 px-3">Update Policy (Click to Toggle)</th>
                <th className="py-2.5 px-3">Timing & Lock Status</th>
                <th className="py-2.5 px-3">Landing</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {releases.map((rel) => {
                const isScheduled = rel.scheduled_release_at && new Date(rel.scheduled_release_at) > new Date();
                const isSelected = selectedReleaseId === rel.id;

                return (
                  <tr key={rel.id} className={`transition ${isSelected ? 'bg-indigo-500/[0.08]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>v{rel.version_name}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Editing
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Build {rel.version_code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 font-mono text-[10px]">
                        {rel.channel}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        disabled={actionLoadingId === rel.id}
                        onClick={() => handleToggleMandatory(rel.id, rel.version_name)}
                        title="Click to instantly toggle between Mandatory and Optional in database"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                          rel.mandatory
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
                        }`}
                      >
                        {actionLoadingId === rel.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : rel.mandatory ? (
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Info className="w-3 h-3 text-blue-400" />
                        )}
                        <span>{rel.mandatory ? 'Mandatory (Force)' : 'Optional'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      {isScheduled ? (
                        <div className="flex items-center gap-1.5 text-violet-300 font-medium">
                          <Lock className="w-3.5 h-3.5 text-violet-400" />
                          <span>
                            {new Date(rel.scheduled_release_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            <span className="text-[10px] text-slate-400">({new Date(rel.scheduled_release_at!).toLocaleDateString()})</span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Live Now</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {rel.is_landing_primary ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          Primary
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isScheduled && (
                          <button
                            type="button"
                            onClick={() => handleQuickUnlock(rel.id, rel.version_name)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition cursor-pointer"
                          >
                            Unlock Now
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectRelease(rel)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300'
                          }`}
                        >
                          {isSelected ? 'Editing' : 'Edit'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
