import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode } from './utils/resolution.js';

function getViewportSize() {
  const viewport = window.visualViewport;

  return {
    width: viewport?.width || window.innerWidth || document.documentElement.clientWidth,
    height: viewport?.height || window.innerHeight || document.documentElement.clientHeight,
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
    window.visualViewport?.addEventListener('resize', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return layout;
}
