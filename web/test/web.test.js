import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webDir = process.cwd();

test('Phase 4: Web Landing App Configurations', () => {
  const pkgPath = path.join(webDir, 'package.json');
  const vitePath = path.join(webDir, 'vite.config.js');
  const tailwindPath = path.join(webDir, 'tailwind.config.js');

  assert.ok(fs.existsSync(pkgPath), 'package.json must exist in web');
  assert.ok(fs.existsSync(vitePath), 'vite.config.js must exist in web');
  assert.ok(fs.existsSync(tailwindPath), 'tailwind.config.js must exist in web');
});

test('Phase 4: React App Component & Shadcn Tokens', () => {
  const appPath = path.join(webDir, 'src', 'App.jsx');
  assert.ok(fs.existsSync(appPath), 'App.jsx must exist in web/src');

  const appContent = fs.readFileSync(appPath, 'utf8');
  assert.ok(appContent.includes('Syncora'), 'App must render Syncora brand');
  assert.ok(appContent.includes('Instant Web Join'), 'App must include instant web join form');
  assert.ok(appContent.includes('Download Extension'), 'App must include download extension button');
});
