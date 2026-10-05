import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { STUN_SERVERS } from '../webrtcManager.js';

const extensionDir = path.resolve(process.cwd(), 'extension');

test('Phase 3: WebRTC STUN Configuration & Manager Module', () => {
  assert.ok(STUN_SERVERS.iceServers.length >= 3, 'Must contain public STUN servers');
  const googleStun = STUN_SERVERS.iceServers.find((s) => s.urls.includes('google.com'));
  assert.ok(googleStun, 'Must use Google Free STUN Server');

  const managerPath = path.join(extensionDir, 'webrtcManager.js');
  assert.ok(fs.existsSync(managerPath), 'webrtcManager.js must exist');
});

test('Phase 3: CSS WebRTC & Floating Emoji Styling Tokens', () => {
  const cssPath = path.join(extensionDir, 'overlay.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.syncora-webcam-bubble'), 'CSS must include webcam bubble styles');
  assert.ok(css.includes('.syncora-emoji-bar'), 'CSS must include emoji trigger bar styles');
  assert.ok(css.includes('syncoraFloatUp'), 'CSS must include animated floating emoji keyframes');
});
