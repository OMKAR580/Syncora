/**
 * Syncora Content Script: Universal Video Detection & Shadow DOM Overlay
 */

(function () {
  if (window.__SYNCORA_INITIALIZED__) return;
  window.__SYNCORA_INITIALIZED__ = true;

  console.log('🎬 Syncora Universal Content Script Loaded on:', window.location.href);

  let activeVideoElement = null;
  let shadowHost = null;
  let shadowRoot = null;
  let isSyncingState = false; // Prevents recursive event feedback loop

  // -------------------------------------------------------------------------
  // 1. UNIVERSAL HTML5 VIDEO DETECTION ENGINE
  // -------------------------------------------------------------------------

  function findActiveVideoElement() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) return null;

    // Prefer playing video or longest duration video
    const playingVideo = videos.find((v) => !v.paused && v.currentTime > 0);
    if (playingVideo) return playingVideo;

    // Otherwise return first visible non-zero video
    return videos[0];
  }

  function setupVideoEventListeners(video) {
    if (!video || video.__syncora_attached__) return;
    video.__syncora_attached__ = true;
    activeVideoElement = video;

    console.log('✅ Syncora attached to video element:', video);

    video.addEventListener('play', () => {
      if (isSyncingState) return;
      notifyVideoEvent('SYNC_PLAY', { currentTime: video.currentTime });
    });

    video.addEventListener('pause', () => {
      if (isSyncingState) return;
      notifyVideoEvent('SYNC_PAUSE', { currentTime: video.currentTime });
    });

    video.addEventListener('seeking', () => {
      if (isSyncingState) return;
      notifyVideoEvent('SYNC_SEEK', { currentTime: video.currentTime });
    });

    video.addEventListener('ratechange', () => {
      if (isSyncingState) return;
      notifyVideoEvent('SYNC_SPEED', { playbackRate: video.playbackRate });
    });
  }

  function notifyVideoEvent(action, payload) {
    chrome.runtime.sendMessage({ action, payload }).catch(() => {});
  }

  // Periodic video scanner for dynamically loaded SPA video players (Netmirror, Netfree, YouTube)
  setInterval(() => {
    const video = findActiveVideoElement();
    if (video && video !== activeVideoElement) {
      setupVideoEventListeners(video);
    }
  }, 1000);

  // -------------------------------------------------------------------------
  // 2. ISOLATED SHADOW DOM FLOATING OVERLAY UI
  // -------------------------------------------------------------------------

  function createShadowOverlay() {
    if (document.getElementById('syncora-shadow-root')) return;

    shadowHost = document.createElement('div');
    shadowHost.id = 'syncora-shadow-root';
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.zIndex = '2147483647';
    document.body.appendChild(shadowHost);

    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // Inject Stylesheet into Shadow Root
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('overlay.css');
    shadowRoot.appendChild(styleLink);

    // Overlay DOM Container
    const container = document.createElement('div');
    container.id = 'syncora-floating-widget';
    container.innerHTML = `
      <!-- Edge Toggle Button -->
      <button id="syncora-toggle" class="syncora-toggle-btn">
        <div class="syncora-pulse-dot"></div>
        <span>Syncora Party</span>
      </button>

      <!-- Sidebar Container -->
      <div id="syncora-sidebar" class="syncora-sidebar hidden">
        <!-- Header -->
        <div class="syncora-header">
          <div class="syncora-brand">
            🍿 <span>Syncora</span> Watch
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="syncora-close" class="syncora-btn-icon" title="Hide (Alt + C)">✕</button>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="syncora-status-bar">
          <span id="syncora-room-tag">Room: Idle</span>
          <span id="syncora-sync-badge" class="syncora-badge">Synced 🟢</span>
        </div>

        <!-- Members Strip -->
        <div id="syncora-members" class="syncora-members-strip">
          <span style="font-size: 11px; color: #888;">No active party</span>
        </div>

        <!-- Chat Area -->
        <div class="syncora-content">
          <div id="syncora-messages" class="syncora-chat-messages">
            <div class="syncora-msg system">Welcome to Syncora! Open extension popup to create or join a party.</div>
          </div>

          <!-- Chat Form -->
          <form id="syncora-chat-form" class="syncora-chat-input-form">
            <input type="text" id="syncora-input" class="syncora-input" placeholder="Type a message..." autocomplete="off" />
            <button type="submit" class="syncora-send-btn">Send</button>
          </form>
        </div>
      </div>
    `;

    shadowRoot.appendChild(container);

    // Wire UI Event Listeners
    const toggleBtn = shadowRoot.querySelector('#syncora-toggle');
    const closeBtn = shadowRoot.querySelector('#syncora-close');
    const sidebar = shadowRoot.querySelector('#syncora-sidebar');
    const chatForm = shadowRoot.querySelector('#syncora-chat-form');
    const chatInput = shadowRoot.querySelector('#syncora-input');

    const toggleSidebar = () => {
      sidebar.classList.toggle('hidden');
    };

    toggleBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', toggleSidebar);

    // Global Hotkey: Alt + C to toggle sidebar
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        toggleSidebar();
      }
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';

      // Append local message placeholder
      appendChatMessage({ sender: 'You', text, isSystem: false });

      // Notify background worker to send chat
      chrome.runtime.sendMessage({ action: 'SEND_CHAT', payload: { text } }).catch(() => {});
    });
  }

  function appendChatMessage({ sender, text, isSystem }) {
    if (!shadowRoot) return;
    const msgContainer = shadowRoot.querySelector('#syncora-messages');
    if (!msgContainer) return;

    const div = document.createElement('div');
    div.className = `syncora-msg ${isSystem ? 'system' : ''}`;
    if (isSystem) {
      div.textContent = text;
    } else {
      div.innerHTML = `<span class="syncora-msg-sender">${escapeHtml(sender)}:</span> ${escapeHtml(text)}`;
    }
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // -------------------------------------------------------------------------
  // 3. REMOTE CONTROL COMMAND EXECUTOR (Play, Pause, Seek)
  // -------------------------------------------------------------------------

  chrome.runtime.onMessage.addListener((msg) => {
    const { action, payload } = msg;
    const video = activeVideoElement || findActiveVideoElement();

    if (action === 'TOGGLE_SIDEBAR') {
      if (shadowRoot) {
        shadowRoot.querySelector('#syncora-sidebar')?.classList.toggle('hidden');
      }
      return;
    }

    if (!video) return;

    isSyncingState = true;
    try {
      if (action === 'EXEC_PLAY') {
        if (typeof payload?.currentTime === 'number' && Math.abs(video.currentTime - payload.currentTime) > 1.2) {
          video.currentTime = payload.currentTime;
        }
        video.play().catch(() => {});
      } else if (action === 'EXEC_PAUSE') {
        if (typeof payload?.currentTime === 'number') {
          video.currentTime = payload.currentTime;
        }
        video.pause();
      } else if (action === 'EXEC_SEEK') {
        if (typeof payload?.currentTime === 'number') {
          video.currentTime = payload.currentTime;
        }
      } else if (action === 'EXEC_CHAT') {
        appendChatMessage(payload);
      }
    } finally {
      setTimeout(() => { isSyncingState = false; }, 300);
    }
  });

  // Check URL parameters for auto room join (e.g. ?syncoraRoom=PARTY-8921)
  const urlParams = new URLSearchParams(window.location.search);
  const autoRoom = urlParams.get('syncoraRoom');
  if (autoRoom) {
    chrome.runtime.sendMessage({ action: 'PARSED_ROOM_ID', payload: { roomId: autoRoom } }).catch(() => {});
  }

  // Initialize Shadow DOM when body is ready
  if (document.body) {
    createShadowOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', createShadowOverlay);
  }
})();
