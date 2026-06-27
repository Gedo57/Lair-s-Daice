import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode } from './utils/resolution.js';

function getViewportSize() {
  return {
    // Do not use window.visualViewport here.
    // On mobile, visualViewport height changes when the keyboard opens,
    // which recalculates scale and pushes/squeezes the game canvas.
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

function computeLayout() {
  const mode = getDeviceMode();
  const resolution = getDesignResolution(mode);
  const viewport = getViewportSize();
  const scale = Math.min(viewport.width / resolution.width, viewport.height / resolution.height);

  return { mode, resolution, scale };
}

export function useFixedViewport() {
  const [layout, setLayout] = useState(() => computeLayout());

  useEffect(() => {
    const update = () => setLayout(computeLayout());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return layout;
}
