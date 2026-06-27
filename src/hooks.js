import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode } from './utils/resolution.js';

const MIN_VIEWPORT_SIZE = { width: 320, height: 240 };
let lastStableViewportSize = null;

function isEditableElement(element) {
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
}

function getRawViewportSize() {
  const root = document.documentElement;
  const visualViewport = window.visualViewport;

  // visualViewport is the most reliable mobile value because it excludes the
  // visible Safari/Chrome browser UI. innerHeight can still include hidden or
  // reserved browser chrome on iOS and causes the 1280x720 frame to be scaled
  // too large and cropped.
  const width = Math.round(
    visualViewport?.width
    || window.innerWidth
    || root.clientWidth
    || MIN_VIEWPORT_SIZE.width,
  );

  const height = Math.round(
    visualViewport?.height
    || window.innerHeight
    || root.clientHeight
    || MIN_VIEWPORT_SIZE.height,
  );

  return {
    width: Math.max(MIN_VIEWPORT_SIZE.width, width),
    height: Math.max(MIN_VIEWPORT_SIZE.height, height),
  };
}

function isMobileKeyboardLikelyOpen(mode, rawViewport) {
  if (mode !== 'mobile') return false;
  if (!isEditableElement(document.activeElement)) return false;

  const layoutHeight = window.innerHeight || document.documentElement.clientHeight || rawViewport.height;
  return layoutHeight - rawViewport.height > Math.max(90, layoutHeight * 0.18);
}

function getViewportSize(mode) {
  const rawViewport = getRawViewportSize();

  if (isMobileKeyboardLikelyOpen(mode, rawViewport) && lastStableViewportSize) {
    return lastStableViewportSize;
  }

  lastStableViewportSize = rawViewport;
  return rawViewport;
}

function computeLayout() {
  const mode = getDeviceMode();
  const resolution = getDesignResolution(mode);
  const viewport = getViewportSize(mode);
  const scale = Math.min(viewport.width / resolution.width, viewport.height / resolution.height);

  return { mode, resolution, viewport, scale };
}

export function useFixedViewport() {
  const [layout, setLayout] = useState(() => computeLayout());

  useEffect(() => {
    let frameId = 0;
    let orientationTimer = 0;
    const visualViewport = window.visualViewport;

    const update = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        setLayout(computeLayout());
      });
    };

    const updateAfterOrientation = () => {
      update();
      window.clearTimeout(orientationTimer);
      orientationTimer = window.setTimeout(update, 280);
    };

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', updateAfterOrientation);
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);

    update();

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', updateAfterOrientation);
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
      window.clearTimeout(orientationTimer);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return layout;
}
