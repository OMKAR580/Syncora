import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const extensionDir = path.resolve(process.cwd(), 'extension');

test('Extension: Manifest V3 Structure & Permissions', () => {
  const manifestPath = path.join(extensionDir, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, 'Syncora - Universal Watch Party');
  assert.ok(manifest.permissions.includes('storage'));
  assert.ok(manifest.permissions.includes('tabs'));
  assert.ok(manifest.host_permissions.includes('<all_urls>'));
  assert.ok(manifest.content_scripts.length > 0);
});

test('Extension: Overlay CSS Theme Tokens', () => {
  const cssPath = path.join(extensionDir, 'overlay.css');
  assert.ok(fs.existsSync(cssPath), 'overlay.css must exist');

  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('--syncora-bg: #09090b'), 'Must contain obsidian black background token');
  assert.ok(css.includes('--syncora-primary: #ef4444'), 'Must contain vibrant crimson red primary token');
  assert.ok(css.includes('#syncora-floating-widget'), 'Must contain floating widget root');
});

test('Extension: Universal Content Script & Popup HTML', () => {
  const contentPath = path.join(extensionDir, 'content.js');
  const popupHtmlPath = path.join(extensionDir, 'popup.html');

  assert.ok(fs.existsSync(contentPath), 'content.js must exist');
  assert.ok(fs.existsSync(popupHtmlPath), 'popup.html must exist');

  const contentJs = fs.readFileSync(contentPath, 'utf8');
  assert.ok(contentJs.includes('findActiveVideoElement'), 'Content script must have video detector');
  assert.ok(contentJs.includes('syncora-shadow-root'), 'Content script must use Shadow DOM root');
  assert.ok(contentJs.includes('Alt + C'), 'Content script must support Alt + C hotkey');

  const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  assert.ok(popupHtml.includes('Create Party'), 'Popup must have Create Party tab');
  assert.ok(popupHtml.includes('Join Party'), 'Popup must have Join Party tab');
});
