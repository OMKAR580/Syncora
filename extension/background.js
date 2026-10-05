/**
 * Syncora Background Service Worker (Manifest V3)
 */

let serverUrl = 'http://localhost:4000';
let activeRoomId = null;
let userToken = null;
let socket = null;

// Initialize background worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 Syncora Watch Party Extension Installed!');
});

// Listen for messages from popup & content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  switch (action) {
    case 'GET_STATUS':
      chrome.storage.local.get(['roomId', 'userToken', 'user', 'serverUrl'], (res) => {
        sendResponse({
          roomId: res.roomId || null,
          userToken: res.userToken || null,
          user: res.user || null,
          serverUrl: res.serverUrl || serverUrl
        });
      });
      return true;

    case 'SET_SERVER_URL':
      if (payload?.url) {
        serverUrl = payload.url;
        chrome.storage.local.set({ serverUrl });
        sendResponse({ success: true });
      }
      return true;

    case 'SAVE_AUTH':
      if (payload?.token && payload?.user) {
        chrome.storage.local.set({ userToken: payload.token, user: payload.user });
        sendResponse({ success: true });
      }
      return true;

    case 'PARSED_ROOM_ID':
      if (payload?.roomId) {
        activeRoomId = payload.roomId;
        chrome.storage.local.set({ roomId: activeRoomId });
        sendResponse({ success: true });
      }
      return true;

    default:
      sendResponse({ status: 'unhandled_action' });
      return false;
  }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_SIDEBAR' });
  }
});
