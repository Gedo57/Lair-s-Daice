export const DESKTOP_RESOLUTION = { width: 1280, height: 720 };
export const MOBILE_RESOLUTION = { width: 720, height: 1280 };

export function getDeviceMode() {
  const isMobile = window.matchMedia('(max-width: 767px), (orientation: portrait)').matches;
  return isMobile ? 'mobile' : 'desktop';
}

export function getDesignResolution(mode) {
  return mode === 'mobile' ? MOBILE_RESOLUTION : DESKTOP_RESOLUTION;
}
