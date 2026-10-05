/**
 * Syncora Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const targetUrlInput = document.getElementById('target-url');
  const createPasswordInput = document.getElementById('create-password');
  const btnCreate = document.getElementById('btn-create');
  const createShareResult = document.getElementById('create-share-result');
  const shareLinkInput = document.getElementById('share-link-input');
  const btnCopyLink = document.getElementById('btn-copy-link');

  const joinRoomIdInput = document.getElementById('join-room-id');
  const joinPasswordInput = document.getElementById('join-password');
  const btnJoin = document.getElementById('btn-join');

  // Auto-fill active tab URL
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        targetUrlInput.value = tabs[0].url;
      }
    });
  }

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // Create Watch Party
  btnCreate.addEventListener('click', async () => {
    const targetUrl = targetUrlInput.value.trim();
    const password = createPasswordInput.value.trim();

    if (!targetUrl) {
      alert('Please enter or open a valid video page URL!');
      return;
    }

    btnCreate.textContent = 'Creating Party...';
    btnCreate.disabled = true;

    try {
      // Generate unique Room ID locally or from server
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const roomId = `PARTY-${code}`;

      const shareUrl = `https://moviesparty-app.vercel.app/join?room=${roomId}&url=${encodeURIComponent(targetUrl)}`;
      shareLinkInput.value = shareUrl;
      createShareResult.style.display = 'block';

      // Save to extension storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ roomId, targetUrl, password });
      }

      btnCreate.textContent = '✅ Party Active!';
    } catch (err) {
      alert('Error creating room: ' + err.message);
      btnCreate.textContent = '🚀 Create Watch Party';
      btnCreate.disabled = false;
    }
  });

  // Copy Link Button
  btnCopyLink.addEventListener('click', () => {
    shareLinkInput.select();
    navigator.clipboard.writeText(shareLinkInput.value);
    btnCopyLink.textContent = 'Copied! 🎉';
    setTimeout(() => { btnCopyLink.textContent = 'Copy Link'; }, 2000);
  });

  // Join Party
  btnJoin.addEventListener('click', () => {
    const roomId = joinRoomIdInput.value.trim().toUpperCase();
    const password = joinPasswordInput.value.trim();

    if (!roomId) {
      alert('Please enter a valid Room ID (e.g. PARTY-8921)');
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ roomId, password });
    }

    alert(`Joined Room ${roomId}! Open the video page to start syncing.`);
  });
});
