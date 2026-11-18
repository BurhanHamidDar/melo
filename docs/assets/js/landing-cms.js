/**
 * Melo Music Landing Page Dynamic CMS & Unbypassable Release Countdown
 */
(function () {
  'use strict';

  // Determine API base URL
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const defaultProdApi = 'https://api.burhanhamid.in';
  const API_BASE = window.MELO_API_BASE || (isLocal ? 'http://localhost:8080' : defaultProdApi);

  let countdownInterval = null;

  function showToast(message) {
    const existing = document.querySelector('.melo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'melo-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return '51 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  }

  async function fetchLandingStatus() {
    try {
      const res = await fetch(`${API_BASE}/v1/landing/status`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Melo CMS] Could not connect to API server:', err.message);
      return null;
    }
  }

  function renderAlertBanner(content) {
    if (!content || !content.alert_banner_enabled || !content.alert_banner_text) {
      const existing = document.querySelector('.melo-alert-banner');
      if (existing) existing.remove();
      return;
    }

    let banner = document.querySelector('.melo-alert-banner');
    if (!banner) {
      banner = document.createElement('div');
      document.body.prepend(banner);
    }

    const type = content.alert_banner_type || 'emerald';
    banner.className = `melo-alert-banner ${type}`;

    let linkHtml = '';
    if (content.alert_banner_link) {
      linkHtml = `<a href="${content.alert_banner_link}" target="_blank" rel="noopener noreferrer">Learn more &rarr;</a>`;
    }

    banner.innerHTML = `
      <span>📢 ${content.alert_banner_text}</span>
      ${linkHtml}
    `;
  }

  function updateHeroHeadline(content) {
    if (!content || !content.hero_headline) return;

    const heroH1 = document.querySelector('.hero h1');
    if (!heroH1) return;

    const raw = content.hero_headline.trim();
    // If separated by comma, split into white and subtitle parts
    if (raw.includes(',')) {
      const parts = raw.split(',');
      const wSpan = heroH1.querySelector('.w');
      const sSpan = heroH1.querySelector('.s');
      if (wSpan) wSpan.textContent = parts[0].trim();
      if (sSpan) sSpan.textContent = parts.slice(1).join(',').trim();
    } else {
      const sSpan = heroH1.querySelector('.s');
      if (sSpan) sSpan.textContent = raw;
    }
  }

  function renderCountdown(targetIso, serverIso, release, ctaContainer) {
    if (countdownInterval) clearInterval(countdownInterval);

    const targetTime = new Date(targetIso).getTime();
    const serverTime = new Date(serverIso).getTime();
    const clientOffset = serverTime - Date.now();

    const card = document.createElement('div');
    card.className = 'melo-countdown-card';
    card.innerHTML = `
      <div class="melo-countdown-header">
        <div class="melo-countdown-tag">
          <span class="melo-pulse-dot"></span>
          <span>Upcoming Launch: v${release.version_name || '2.0.0'}</span>
        </div>
        <div class="melo-countdown-secure">
          <span>🔒 Server-Gated</span>
        </div>
      </div>

      <div class="melo-countdown-grid">
        <div class="melo-time-box">
          <span class="melo-time-digit" id="melo-days">00</span>
          <span class="melo-time-label">Days</span>
        </div>
        <div class="melo-time-box">
          <span class="melo-time-digit" id="melo-hours">00</span>
          <span class="melo-time-label">Hours</span>
        </div>
        <div class="melo-time-box">
          <span class="melo-time-digit" id="melo-mins">00</span>
          <span class="melo-time-label">Mins</span>
        </div>
        <div class="melo-time-box">
          <span class="melo-time-digit" id="melo-secs">00</span>
          <span class="melo-time-label">Secs</span>
        </div>
      </div>

      <div class="melo-countdown-footer">
        <p class="melo-countdown-note">Downloads unlock automatically when the countdown expires.</p>
        <button type="button" class="melo-locked-btn" id="melo-locked-trigger">
          <span>Locked</span>
        </button>
      </div>
    `;

    // Replace first button in cta or prepend
    const existingDownload = ctaContainer.querySelector('.pill:first-child');
    if (existingDownload) {
      existingDownload.replaceWith(card);
    } else {
      ctaContainer.prepend(card);
    }

    const lockedBtn = card.querySelector('#melo-locked-trigger');
    if (lockedBtn) {
      lockedBtn.addEventListener('click', () => {
        showToast('🔒 This release is scheduled. The server will reject download requests until the countdown finishes.');
      });
    }

    function tick() {
      const now = Date.now() + clientOffset;
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(countdownInterval);
        showToast('🎉 Release is now live! Unlocking downloads...');
        // Refresh status from server to receive the unlocked download URL
        setTimeout(initLandingCMS, 1000);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      const dEl = document.getElementById('melo-days');
      const hEl = document.getElementById('melo-hours');
      const mEl = document.getElementById('melo-mins');
      const sEl = document.getElementById('melo-secs');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  function renderLiveDownload(release, ctaContainer) {
    if (countdownInterval) clearInterval(countdownInterval);

    const downloadUrl = release.download_url
      ? (release.download_url.startsWith('http') ? release.download_url : `${API_BASE}${release.download_url}`)
      : 'https://github.com/BurhanHamidDar/melo/releases/latest';

    const fileSizeStr = formatBytes(release.file_size_bytes);
    const shortSha = release.sha256 ? `${release.sha256.substring(0, 10)}...` : '';

    const widget = document.createElement('div');
    widget.className = 'melo-live-widget';
    widget.innerHTML = `
      <a class="melo-download-btn press" href="${downloadUrl}">
        <i>
          <svg viewBox="0 0 24 24">
            <path d="M12 4.5v11M7 11l5 5 5-5M5.5 19.5h13"/>
          </svg>
        </i>
        <span>Download Melo v${release.version_name || '2.0.0'} (${fileSizeStr})</span>
      </a>

      ${
        release.sha256
          ? `
        <div class="melo-sha-bar">
          <span>SHA-256:</span>
          <span class="melo-sha-badge" id="melo-copy-sha" title="Click to copy SHA-256 fingerprint">
            ${shortSha} 📋
          </span>
        </div>
      `
          : ''
      }
    `;

    const existingCard = ctaContainer.querySelector('.melo-countdown-card');
    const existingDownload = ctaContainer.querySelector('.pill:first-child');
    if (existingCard) {
      existingCard.replaceWith(widget);
    } else if (existingDownload) {
      existingDownload.replaceWith(widget);
    } else {
      ctaContainer.prepend(widget);
    }

    const shaBadge = widget.querySelector('#melo-copy-sha');
    if (shaBadge) {
      shaBadge.addEventListener('click', () => {
        navigator.clipboard.writeText(release.sha256).then(() => {
          showToast('📋 Copied full SHA-256 checksum to clipboard!');
        });
      });
    }
  }

  async function initLandingCMS() {
    const data = await fetchLandingStatus();
    if (!data) return;

    // 1. Alert Banner
    if (data.landing_content) {
      renderAlertBanner(data.landing_content);
      updateHeroHeadline(data.landing_content);
    }

    // 2. Ensure landing page CTA links cleanly to the dedicated download page
    const firstPill = document.querySelector('.hero .cta .pill:first-child');
    if (firstPill) {
      firstPill.href = 'download.html';
      if (data.status === 'scheduled') {
        firstPill.innerHTML = `<i><svg class="line" viewBox="0 0 24 24"><path d="M12 4.5v11M7 11l5 5 5-5M5.5 19.5h13"/></svg></i>Get Melo (Launching Soon)`;
      } else if (data.release && data.release.version_name) {
        firstPill.innerHTML = `<i><svg class="line" viewBox="0 0 24 24"><path d="M12 4.5v11M7 11l5 5 5-5M5.5 19.5h13"/></svg></i>Download Melo v${data.release.version_name}`;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLandingCMS);
  } else {
    initLandingCMS();
  }
})();
