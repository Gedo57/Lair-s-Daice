import { useEffect, useState } from 'react';
import { getDesignResolution, getDeviceMode } from './utils/resolution.js';

function computeLayout() {
  const mode = getDeviceMode();
  const resolution = getDesignResolution(mode);
  const scale = Math.min(window.innerWidth / resolution.width, window.innerHeight / resolution.height);
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
