'use client';

import React, { useState, useEffect } from 'react';
import { getLandingContent, updateLandingContent, LandingContent, LandingScreenshot } from '@/lib/api';
import {
  Globe,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Megaphone,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Type,
} from 'lucide-react';
import { MeloGlobeIcon } from '@/components/MeloIcons';

export default function LandingPageCMS() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [heroHeadline, setHeroHeadline] = useState('Music With style <3');
  const [heroSubtext, setHeroSubtext] = useState('Free, forever. Clean playback, synced lyrics, modules, and cloud sync.');
  
  const [alertBannerEnabled, setAlertBannerEnabled] = useState(false);
  const [alertBannerText, setAlertBannerText] = useState('');
  const [alertBannerType, setAlertBannerType] = useState<'info' | 'emerald' | 'amber' | 'rose'>('emerald');
  const [alertBannerLink, setAlertBannerLink] = useState('');

  const [screenshots, setScreenshots] = useState<LandingScreenshot[]>([]);
  const [newShotUrl, setNewShotUrl] = useState('');
  const [newShotCaption, setNewShotCaption] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getLandingContent();
      if (data && data.content) {
        const c = data.content;
        setContent(c);
        setHeroHeadline(c.hero_headline || 'Music With style <3');
        setHeroSubtext(c.hero_subtext || '');
        setAlertBannerEnabled(c.alert_banner_enabled || false);
        setAlertBannerText(c.alert_banner_text || '');
        setAlertBannerType(c.alert_banner_type || 'emerald');
        setAlertBannerLink(c.alert_banner_link || '');
        setScreenshots(Array.isArray(c.screenshots) ? c.screenshots : []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load landing content from database');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScreenshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShotUrl.trim()) return;

    const nextOrder = screenshots.length + 1;
    const updated = [
      ...screenshots,
      {
        url: newShotUrl.trim(),
        order: nextOrder,
        caption: newShotCaption.trim() || undefined,
      },
    ];
    setScreenshots(updated);
    setNewShotUrl('');
    setNewShotCaption('');
  };

  const handleRemoveScreenshot = (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateLandingContent({
        hero_headline: heroHeadline,
        hero_subtext: heroSubtext,
        alert_banner_enabled: alertBannerEnabled,
        alert_banner_text: alertBannerText ? alertBannerText.trim() : null,
        alert_banner_type: alertBannerType,
        alert_banner_link: alertBannerLink ? alertBannerLink.trim() : null,
        screenshots: screenshots,
      });

      if (res && res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update landing page content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MeloGlobeIcon size={22} className="text-[#f5e27a]" />
            <span>Landing Page Content Management (CMS)</span>
          </h1>
          <p className="text-xs text-[#a6a6ad] mt-0.5 font-medium">
            Dynamically update hero marketing copy, announcement banners, and showcased app screenshots
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#18181b] hover:bg-[#232327] text-xs font-semibold text-[#a6a6ad] hover:text-white border border-white/[0.08] transition"
        >
          <Eye className="w-3.5 h-3.5 text-[#f5e27a]" />
          <span>View Live Site</span>
          <ExternalLink className="w-3 h-3 text-[#6c6c74]" />
        </a>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Landing page content updated successfully and published to Neon DB!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Live Preview Card */}
        <div className="p-5 bg-gradient-to-b from-[#151624] to-[#10111a] border border-white/[0.08] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Hero Preview
            </span>
            <span className="text-[10px] text-slate-500">Updates in real-time</span>
          </div>

          {/* Banner Preview */}
          {alertBannerEnabled && (
            <div
              className={`p-2.5 px-4 rounded-xl text-xs flex items-center justify-between border ${
                alertBannerType === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : alertBannerType === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : alertBannerType === 'rose'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Megaphone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium truncate">{alertBannerText || 'Announcement text preview'}</span>
              </div>
              {alertBannerLink && (
                <span className="text-[11px] underline flex-shrink-0 ml-2">Learn more &rarr;</span>
              )}
            </div>
          )}

          {/* Headline & Subtext Preview */}
          <div className="py-4 text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {heroHeadline || 'Music With style <3'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {heroSubtext || 'Free, forever. Clean playback, synced lyrics, modules, and cloud sync.'}
            </p>
          </div>
        </div>

        {/* Hero Marketing Copy Editor */}
        <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Type className="w-4 h-4 text-indigo-400" />
            <span>Hero Headline & Marketing Copy</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Hero Headline
              </label>
              <input
                type="text"
                required
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                placeholder="e.g. Music With style <3"
                className="w-full px-3.5 py-2.5 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Hero Subtext / Lead Description
              </label>
              <textarea
                rows={2}
                value={heroSubtext}
                onChange={(e) => setHeroSubtext(e.target.value)}
                placeholder="e.g. A free music player for Android with style. Player styles, synced lyrics, and cloud library sync."
                className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Global Announcement Alert Banner */}
        <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Megaphone className="w-4 h-4 text-indigo-400" />
              <span>Announcement Alert Banner</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertBannerEnabled}
                onChange={(e) => setAlertBannerEnabled(e.target.checked)}
                className="rounded border-white/[0.1] bg-[#171822] text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300 font-medium">Show Banner</span>
            </label>
          </div>

          {alertBannerEnabled && (
            <div className="space-y-4 pt-2 border-t border-white/[0.06]">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Banner Text Message
                </label>
                <input
                  type="text"
                  value={alertBannerText}
                  onChange={(e) => setAlertBannerText(e.target.value)}
                  placeholder="e.g. 🚀 Melo V2 with Cloud Sync is dropping soon!"
                  className="w-full px-3.5 py-2.5 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Banner Theme / Severity
                  </label>
                  <select
                    value={alertBannerType}
                    onChange={(e: any) => setAlertBannerType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="emerald">Emerald (Success / Launch)</option>
                    <option value="info">Indigo (Informational)</option>
                    <option value="amber">Amber (Upcoming Notice)</option>
                    <option value="rose">Rose (Urgent Maintenance)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Optional Action Link URL
                  </label>
                  <input
                    type="text"
                    value={alertBannerLink}
                    onChange={(e) => setAlertBannerLink(e.target.value)}
                    placeholder="e.g. https://github.com/BurhanHamidDar/melo"
                    className="w-full px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Screenshot Gallery Manager */}
        <div className="p-6 bg-[#12131b] border border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>Showcased App Screenshots Gallery</span>
          </div>

          {/* Current Screenshots List */}
          <div className="space-y-3">
            {screenshots.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No custom screenshots added yet (using defaults).</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {screenshots.map((shot, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#171822] border border-white/[0.08] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate">{shot.caption || 'Screenshot'}</p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{shot.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Screenshot Controls */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Image URL or relative path (e.g. assets/img/app-player.webp)"
              value={newShotUrl}
              onChange={(e) => setNewShotUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <input
              type="text"
              placeholder="Caption (e.g. Flagship Player)"
              value={newShotCaption}
              onChange={(e) => setNewShotCaption(e.target.value)}
              className="w-full sm:w-56 px-3.5 py-2 bg-[#171822] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddScreenshot}
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-medium text-white transition flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Database...' : 'Save & Publish to Landing Page'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
