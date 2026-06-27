import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode, getEffectiveLayoutMode, getViewportOrientation } from './utils/resolution.js';

const SAFARI_EXCLUSION_PATTERN = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Edg|OPR|SamsungBrowser/i;
const CHROME_PATTERN = /CriOS|Chrome|Chromium/i;
const CHROME_EXCLUSION_PATTERN = /FxiOS|EdgiOS|OPiOS|Edg|OPR|SamsungBrowser/i;

function isSafariBrowser() {
  const userAgent = window.navigator.userAgent || '';
  const vendor = window.navigator.vendor || '';
  return /Safari/i.test(userAgent)
    && /Apple/i.test(vendor)
    && !SAFARI_EXCLUSION_PATTERN.test(userAgent);
}

function isChromeBrowser() {
  const userAgent = window.navigator.userAgent || '';
  return CHROME_PATTERN.test(userAgent)
    && !CHROME_EXCLUSION_PATTERN.test(userAgent);
}

function getBrowserName() {
  if (isSafariBrowser()) return 'safari';
  if (isChromeBrowser()) return 'chrome';
  return '';
}

function getBaseViewportSize() {
  return {
    // Do not use window.visualViewport here.
    // On mobile, visualViewport height changes when the keyboard opens,
    // which recalculates scale and pushes/squeezes the game canvas.
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

function getSafariViewportSize() {
  const visualViewport = window.visualViewport;
  const documentElement = document.documentElement;
  const fallbackViewport = getBaseViewportSize();

  return {
    // Safari can report 100vh / innerHeight as the full layout viewport while
    // the visible area is smaller because of the browser chrome. visualViewport
    // gives the real visible space, so the 1280x720 frame can scale without crop.
    width: Math.floor(visualViewport?.width || fallbackViewport.width || documentElement.clientWidth),
    height: Math.floor(visualViewport?.height || documentElement.clientHeight || fallbackViewport.height),
  };
}

function getViewportSize(isSafari) {
  return isSafari ? getSafariViewportSize() : getBaseViewportSize();
}

function applyViewportCssVariables(viewport, browserName) {
  const root = document.documentElement;

  if (browserName) {
    root.dataset.browser = browserName;
  } else {
    delete root.dataset.browser;
  }

  if (browserName === 'safari') {
    root.style.setProperty('--app-viewport-width', `${viewport.width}px`);
    root.style.setProperty('--app-viewport-height', `${viewport.height}px`);
    return;
  }

  root.style.removeProperty('--app-viewport-width');
  root.style.removeProperty('--app-viewport-height');
}

function computeLayout() {
  const deviceMode = getDeviceMode();
  const browserName = getBrowserName();
  const isSafari = browserName === 'safari';
  const viewport = getViewportSize(isSafari);
  const orientation = getViewportOrientation(viewport);
  const mode = getEffectiveLayoutMode(deviceMode, orientation);
  const resolution = getDesignResolution(mode, orientation);
  const scale = Math.min(viewport.width / resolution.width, viewport.height / resolution.height);

  return { mode, deviceMode, resolution, viewport, scale, orientation, isSafari, browserName };
}

export function useFixedViewport() {
  const [layout, setLayout] = useState(() => computeLayout());

  useEffect(() => {
    const update = () => {
      const nextLayout = computeLayout();
      applyViewportCssVariables(nextLayout.viewport, nextLayout.browserName);
      setLayout(nextLayout);
    };

    const visualViewport = window.visualViewport;

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);

    update();

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--app-viewport-width');
      document.documentElement.style.removeProperty('--app-viewport-height');
      delete document.documentElement.dataset.browser;
    };
  }, []);

  return layout;
}
