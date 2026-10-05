# 🍿 Syncora - Universal Watch Party Platform

> Watch movies, anime, and videos together on **Netmirror, Netfree, Netflix, YouTube, Hotstar & any website** in real-time with sub-second video sync, live WebRTC video call, and distraction-free chat.

![Syncora Energetic Red Dark Theme](https://img.shields.io/badge/Theme-Black%20%26%20Crimson%20Red-ef4444?style=for-the-badge)
![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-09090b?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)

---

## 🌟 Key Features

- 🎬 **Universal Video Detection Engine**: Automatically detects HTML5 video players on Netmirror, Netfree, Netflix, YouTube, anime streaming & custom movie sites.
- ⚡ **Zero Quality Loss & Sub-Second Sync**: Streams directly from the source website in native HD/4K quality. Automatically adjusts playback time if internet lags.
- 🎥 **Free WebRTC Video & Audio Calls**: Webcam bubbles & mic mute/unmute powered by Google STUN servers (`stun:stun.l.google.com:19302`). 100% free forever.
- 🙈 **Distraction-Free UI (`Alt + C`)**: Hide/Show the floating glassmorphism chat & webcam overlay with 1-click or hotkey `Alt + C`.
- 🔑 **Room Search & Passcode Protection**: Join via direct shareable link or by searching Room ID (e.g. `PARTY-8921`) + entering optional password.
- 🎛️ **Free-for-All Playback Control**: Any participant can play, pause, or seek video, with optional Host Lock mode.
- 📱 **100% Responsive Design**: Full Chrome Extension on laptops & Responsive Mobile Web App.
- 💰 **100% Lifetime Free Hosting**: Configured for Render.com (Backend) and Vercel (Web Landing App).

---

## 🏗️ Architecture Blueprint

```
+-----------------------------------------------------------------------+
|                         CHROME EXTENSION                              |
|  +-----------------------+  +-------------------+  +---------------+  |
|  | Content Script        |  | Shadow DOM Overlay|  | Background    |  |
|  | (Captures Video)      |  | (Chat, Voice, UI) |  | Service Worker|  |
|  +-----------+-----------+  +---------+---------+  +-------+-------+  |
+--------------|------------------------|--------------------|----------+
               |                        |                    |
               +------------------------+--------------------+
                                        | (Socket.io WebSockets)
                                        v
+-----------------------------------------------------------------------+
|                      NODE.JS BACKEND SERVER                           |
|  +-----------------------+  +-------------------+  +---------------+  |
|  | Socket.io Room Engine |  | Auth / JWT Module |  | WebRTC Signaling|
|  | (Playback & Time Sync)|  | (Google / Email)  |  | (Audio/Video) |  |
|  +-----------------------+  +-------------------+  +---------------+  |
+-----------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
Syncora/
├── extension/          # Manifest V3 Chrome Extension source code & tests
│   ├── manifest.json   # Chrome V3 manifest with <all_urls> permissions
│   ├── content.js      # Universal video detector & Shadow DOM injector
│   ├── overlay.css     # Black & Crimson Red Shadcn aesthetic styles
│   ├── popup.html      # Create & Join party popup UI
│   ├── popup.js        # Popup script & link generator
│   ├── background.js   # Service worker & storage manager
│   ├── webrtcManager.js# Peer-to-Peer video/audio call engine
│   └── test/           # Extension automated test suite
├── server/             # Node.js + Express + Socket.io backend server
│   ├── src/
│   │   ├── index.js        # Main server entry point
│   │   ├── auth.js         # JWT auth & guest user generator
│   │   ├── roomManager.js  # Production room state store
│   │   └── socketHandler.js# Real-time video sync & WebRTC socket events
│   ├── render.yaml     # 100% Free Render.com deployment config
│   └── test/           # Backend automated test suite
├── web/                # Vite + React + Tailwind Web App
│   ├── src/App.jsx     # Landing page & instant web join portal
│   ├── vercel.json     # 100% Free Vercel deployment config
│   └── test/           # Web app automated test suite
└── package.json        # Root monorepo script runner
```

---

## 🛠️ Quick Setup & Development Guide

### 1. Backend Server Setup
```bash
cd server
npm install
npm run dev
# Server running on http://localhost:4000
```

### 2. Chrome Extension Setup
1. Open Chrome and navigate to `chrome://extensions`.
2. Turn on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `Syncora/extension` directory.

### 3. Web App Setup
```bash
cd web
npm install
npm run dev
# Web app running on http://localhost:3000
```

---

## 🧪 Run Test Suite

To run all automated test suites across backend server, extension, and web app:
```bash
npm test
```

---

## 🌿 Git Branching & Workflow

This project adheres to strict Git Flow standards:
- **`main`**: Production-ready, fully tested releases.
- **`develop`**: Active development branch. All features are verified with automated tests before merging to `main`.

---

## 🚀 Deployment Guide (100% Free)

### Deploy Backend to Render.com
1. Connect GitHub repo `OMKAR580/Syncora` to Render.com.
2. Select **Blueprint** deployment using `server/render.yaml` or create a Web Service pointing to root directory `server/`.
3. Set build command: `npm install` and start command: `node src/index.js`.

### Deploy Web App to Vercel
1. Import `OMKAR580/Syncora` repository on Vercel.
2. Set Root Directory to `web/`.
3. Framework Preset: **Vite**. Click **Deploy**!

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.