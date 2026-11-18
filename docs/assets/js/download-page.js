/**
 * Melo Music — Play Store Style Download Experience & Unbypassable Countdown Controller
 */
(function () {
  'use strict';

  // API Base Configuration
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = window.MELO_API_BASE || (isLocal ? 'http://localhost:8080' : 'https://api.burhanhamid.in');

  let countdownInterval = null;

  function showToast(message) {
    const existing = document.querySelector('.melo-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'melo-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c1c22;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      opacity: 1;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return '38.4 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  async function fetchReleaseStatus() {
    try {
      const res = await fetch(`${API_BASE}/v1/landing/status`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Download Controller] Could not reach backend API:', err.message);
      return null;
    }
  }

  function renderCountdown(targetIso, serverIso, release) {
    if (countdownInterval) clearInterval(countdownInterval);

    const targetTime = new Date(targetIso).getTime();
    const serverTime = new Date(serverIso).getTime();
    const clientOffset = serverTime - Date.now();

    const timerWrap = document.getElementById('cd-timer-section');
    const ctaContainer = document.getElementById('action-cta-area');

    if (!timerWrap || !ctaContainer) return;

    timerWrap.style.display = 'block';

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    // Update locked CTA button with live countdown timer directly on the button
    ctaContainer.innerHTML = `
      <button type="button" class="btn-locked" id="locked-btn-trigger">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--play-gold);">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Unlocks in <span class="btn-countdown-val" id="btn-timer-val">00d 00h 00m 00s</span></span>
      </button>
      <a href="https://github.com/BurhanHamidDar/melo/releases" target="_blank" rel="noopener noreferrer" class="btn-secondary-gh">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
        </svg>
        <span>GitHub Mirror</span>
      </a>
    `;

    const lockedTrigger = document.getElementById('locked-btn-trigger');
    if (lockedTrigger) {
      lockedTrigger.addEventListener('click', () => {
        showToast('🔒 This release is scheduled. The download button will unlock automatically when the timer reaches zero.');
      });
    }

    function tick() {
      const now = Date.now() + clientOffset;
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(countdownInterval);
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        renderLiveDownload(release);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(s).padStart(2, '0');

      const btnTimer = document.getElementById('btn-timer-val');
      if (btnTimer) {
        btnTimer.textContent = `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
      }
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  function renderLiveDownload(release) {
    const timerWrap = document.getElementById('cd-timer-section');
    const ctaContainer = document.getElementById('action-cta-area');

    if (timerWrap) timerWrap.style.display = 'none';
    if (!ctaContainer) return;

    let downloadUrl = release && release.download_url
      ? release.download_url
      : `${API_BASE}/v1/releases/download?channel=stable`;

    if (downloadUrl.startsWith('/')) {
      downloadUrl = `${API_BASE}${downloadUrl}`;
    }

    const sizeStr = formatBytes(release ? release.file_size_bytes : 38381180);
    const verStr = release ? release.version_name : '8.4.1';

    ctaContainer.innerHTML = `
      <a href="${downloadUrl}" class="btn-primary-install" id="direct-dl-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Download APK (v${verStr} • ${sizeStr})</span>
      </a>
      <a href="https://github.com/BurhanHamidDar/melo/releases" target="_blank" rel="noopener noreferrer" class="btn-secondary-gh">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
        </svg>
        <span>GitHub Mirror</span>
      </a>
    `;

    const dlBtn = document.getElementById('direct-dl-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        showToast('🚀 Downloading Melo Universal Release APK...');
      });
    }
  }

  function updateMetadata(release, rawData) {
    if (!release) return;

    if (release.version_name) {
      const verEls = document.querySelectorAll('.dynamic-ver-name');
      verEls.forEach((el) => { el.textContent = `v${release.version_name}`; });
    }

    // Real download count
    const totalDl = (rawData && rawData.total_downloads !== undefined)
      ? rawData.total_downloads
      : (release.download_count || 0);
    const dlEls = document.querySelectorAll('.dynamic-downloads-val');
    dlEls.forEach((el) => {
      if (totalDl > 1000) {
        el.textContent = `${(totalDl / 1000).toFixed(1)}K+`;
      } else {
        el.textContent = String(totalDl);
      }
    });

    if (release.sha256) {
      const shaEl = document.getElementById('spec-sha256');
      if (shaEl) shaEl.textContent = release.sha256;
    }

    if (release.file_size_bytes) {
      const sizeEls = document.querySelectorAll('.dynamic-app-size');
      sizeEls.forEach((el) => { el.textContent = formatBytes(release.file_size_bytes); });
    }

    if (release.release_notes) {
      const notesList = document.getElementById('whats-new-items');
      if (notesList) {
        notesList.innerHTML = '';
        const lines = release.release_notes.split('\n');
        lines.forEach((line) => {
          const trimmed = line.trim().replace(/^[-*•]\s*/, '');
          if (trimmed) {
            const li = document.createElement('li');
            li.textContent = trimmed;
            notesList.appendChild(li);
          }
        });
      }
    }
  }

  // Setup Carousel Controls
  function initCarousel() {
    const carousel = document.getElementById('shots-carousel');
    const leftBtn = document.getElementById('arrow-left');
    const rightBtn = document.getElementById('arrow-right');

    if (!carousel) return;

    if (leftBtn) {
      leftBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: -260, behavior: 'smooth' });
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: 260, behavior: 'smooth' });
      });
    }

    // Lightbox
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');

    if (modal && modalImg) {
      document.querySelectorAll('.shot-card').forEach((card) => {
        card.addEventListener('click', () => {
          const img = card.querySelector('img');
          if (img) {
            modalImg.src = img.src;
            modal.classList.add('active');
          }
        });
      });

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      }

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  // Setup Checksum Copy
  function initCopy() {
    const copyBtn = document.getElementById('copy-sha-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const shaEl = document.getElementById('spec-sha256');
        if (shaEl) {
          navigator.clipboard.writeText(shaEl.textContent.trim()).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
          });
        }
      });
    }
  }

  // Main Orchestrator
  async function init() {
    initCarousel();
    initCopy();

    const data = await fetchReleaseStatus();

    const targetScheduledAt = data?.scheduled_release_at || data?.release?.scheduled_release_at;
    if (data && data.status === 'scheduled' && targetScheduledAt) {
      renderCountdown(targetScheduledAt, data.server_time, data.release);
      updateMetadata(data.release, data);
    } else if (data && data.release) {
      renderLiveDownload(data.release);
      updateMetadata(data.release, data);
    } else {
      // Offline fallback: show live v8.4.1 download
      renderLiveDownload({
        version_name: '8.4.1 build#1256',
        file_size_bytes: 38381180,
        sha256: 'FD62078FAE74B071F76F0DD6FFED5F03C225768EE46EE32E41507BA27C925A65',
        download_url: 'https://github.com/BurhanHamidDar/melo/releases',
        download_count: 0,
      });
      updateMetadata(null, { total_downloads: 0 });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
