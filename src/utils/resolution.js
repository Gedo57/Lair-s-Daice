export const DESKTOP_RESOLUTION = { width: 1280, height: 720 };
export const MOBILE_RESOLUTION = { width: 1280, height: 720 };

export function getDeviceMode() {
  const isMobile = window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
  return isMobile ? 'mobile' : 'desktop';
}

export function getDesignResolution(mode) {
  return mode === 'mobile' ? MOBILE_RESOLUTION : DESKTOP_RESOLUTION;
}
