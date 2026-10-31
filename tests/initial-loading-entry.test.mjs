import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const loading = readFileSync(new URL('../src/screens/LoadingScreen.jsx', import.meta.url), 'utf8');

test('Provider, Platform and SideSix launches route through loading, never straight to main menu', () => {
  assert.match(main, /loginWithProviderLaunch\(launch\);\s*\/\/[\s\S]*?window\.history\.replaceState\(\{\}, '', '\/loading'\)/);
  assert.match(main, /url\.pathname = '\/loading'/);
  assert.match(main, /sanitizeSideSixLaunchUrl\('\/loading'\)/);
  assert.doesNotMatch(main, /url\.pathname = '\/main-menu'/);
});
test('the themed loading screen is drawn before a backend launch and during first asset preload', () => {
  const firstPaint = main.indexOf('root.render(<PreAuthLoading />)');
  const network = main.indexOf('const providerLaunched = await exchangeProviderLaunchIfPresent()');
  assert.ok(firstPaint >= 0 && firstPaint < network);
  assert.match(main, /className=\{\`app-shell app-shell--\$\{layout\.mode\} app-shell--loading\`\}/);
  assert.match(app, /const RenderedScreenComponent = isBootPreloading \? LoadingScreen : ScreenComponent/);
  assert.match(loading, /assets\/liars-dice\/loading/);
});
test('the real loading progress survives parent rerenders and cleans up the completion timer', () => {
  assert.match(loading, /goMainMenuRef\.current = navigation\?\.goMainMenu/);
  assert.match(loading, /\}, \[isPreloadingAssets\]\);/);
  assert.doesNotMatch(loading, /\[isPreloadingAssets,\s*navigation\]/);
  assert.match(loading, /window\.clearTimeout\(id\)/);
  assert.match(loading, /localProgress < 100/);
});
