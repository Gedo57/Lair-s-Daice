import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode } from './utils/resolution.js';

const SAFARI_EXCLUSION_PATTERN = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Edg|OPR|SamsungBrowser/i;

function isSafariBrowser() {
  const userAgent = window.navigator.userAgent || '';
  const vendor = window.navigator.vendor || '';
  return /Safari/i.test(userAgent)
    && /Apple/i.test(vendor)
    && !SAFARI_EXCLUSION_PATTERN.test(userAgent);
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

function applyViewportCssVariables(viewport, isSafari) {
  const root = document.documentElement;

  if (isSafari) {
    root.dataset.browser = 'safari';
    root.style.setProperty('--app-viewport-width', `${viewport.width}px`);
    root.style.setProperty('--app-viewport-height', `${viewport.height}px`);
    return;
  }

  if (root.dataset.browser === 'safari') {
    delete root.dataset.browser;
  }
  root.style.removeProperty('--app-viewport-width');
  root.style.removeProperty('--app-viewport-height');
}

function computeLayout() {
  const mode = getDeviceMode();
  const resolution = getDesignResolution(mode);
  const isSafari = isSafariBrowser();
  const viewport = getViewportSize(isSafari);
  const scale = Math.min(viewport.width / resolution.width, viewport.height / resolution.height);

  return { mode, resolution, viewport, scale, isSafari };
}

export function useFixedViewport() {
  const [layout, setLayout] = useState(() => computeLayout());

  useEffect(() => {
    const update = () => {
      const nextLayout = computeLayout();
      applyViewportCssVariables(nextLayout.viewport, nextLayout.isSafari);
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
      if (document.documentElement.dataset.browser === 'safari') {
        delete document.documentElement.dataset.browser;
      }
    };
  }, []);

  return layout;
}
