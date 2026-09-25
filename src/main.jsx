import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base/reset.css';
import './styles/base/layout.css';
import './styles/base/orientation-guard.css';
import './styles/base/asset-boot-screen.css';
import './styles/base/components.css';
import './styles/screens/screens.desktop.css';
import './styles/screens/screens.mobile.css';
import './styles/screens/screens.portrait.css';
import './styles/screens/screens.shared.css';
import './styles/screens/screens.controls.css';

import './styles/gameplay/gameplay.variables.css';
import './styles/gameplay/gameplay.shared.css';
import './styles/gameplay/gameplay.landscape.css';
import './styles/gameplay/gameplay.portrait.css';
import './styles/gameplay/gameplay.states.css';
import './styles/gameplay/gameplay.controls.css';
import './styles/gameplay/opening-coin-flip.css';
import './styles/gameplay/slam-animation.css';
import './styles/gameplay/call-liar-animation.css';
import './styles/gameplay/zai-animation.css';
import './styles/gameplay/fei-animation.css';
import './styles/base/language.css';
import './styles/screens/tutorial.css';

const SIDE_SIX_LAUNCH_KEYS = ['userId', 'userName', 'ts', 'nonce', 'sig', 'avatarUrl', 'locale', 'returnUrl'];
const SIDE_SIX_RETURN_URL_KEY = 'ld_sidesix_return_url';

function sideSixLaunchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const required = ['userId', 'userName', 'ts', 'nonce', 'sig'];
  if (!required.every((key) => params.get(key))) return null;
  const payload = {};
  for (const key of SIDE_SIX_LAUNCH_KEYS) {
    const value = params.get(key);
    if (value !== null && value !== '') payload[key] = value;
  }
  return payload;
}

function sanitizeSideSixLaunchUrl(targetPath = null) {
  const url = new URL(window.location.href);
  for (const key of SIDE_SIX_LAUNCH_KEYS) url.searchParams.delete(key);
  if (targetPath) url.pathname = targetPath;
  const query = url.searchParams.toString();
  window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash || ''}`);
}

async function exchangeSideSixLaunchIfPresent() {
  const launch = sideSixLaunchFromUrl();
  if (!launch) return false;
  const { loginWithSideSixLaunch } = await import('./api/authApi.js');
  const payload = await loginWithSideSixLaunch(launch);
  const returnUrl = payload?.sidesix?.returnUrl || launch.returnUrl || null;
  try {
    if (returnUrl) window.sessionStorage.setItem(SIDE_SIX_RETURN_URL_KEY, returnUrl);
    else window.sessionStorage.removeItem(SIDE_SIX_RETURN_URL_KEY);
  } catch (_error) {
    // The signed launch is already verified server-side; storage is optional.
  }
  sanitizeSideSixLaunchUrl('/main-menu');
  return true;
}

async function bootstrap() {
  const root = createRoot(document.getElementById('root'));
  try {
    let cleanPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const isDirectTutorialRoute = cleanPath.toLowerCase() === '/tutorial';

    if (!isDirectTutorialRoute) {
      await exchangeSideSixLaunchIfPresent();
      cleanPath = window.location.pathname.replace(/\/+$/, '') || '/';
    }
    const rootModule = cleanPath.toLowerCase() === '/tutorial'
      ? await import('./TutorialStandaloneApp.jsx')
      : await import('./App.jsx');
    const RootComponent = rootModule.default;
    root.render(
      <React.StrictMode>
        <RootComponent />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Application bootstrap failed', error);
    root.render(
      <div style={{ color: '#fff', background: '#050200', minHeight: '100vh', padding: '32px', fontFamily: 'Arial, sans-serif' }}>
        The application could not be loaded. Open the browser console for details.
      </div>,
    );
  }
}

void bootstrap();
