const mainMenuAsset = '/assets/liars-dice/main-menu/';
const roomSelectAsset = '/assets/liars-dice/room-select/';
const profileAsset = '/assets/liars-dice/profile/';
const loadingAsset = '/assets/liars-dice/loading/';
const portraitAsset = '/assets/liars-dice/mobile-portrait/';

export const CRITICAL_ASSETS = {
  loading: [
    `${portraitAsset}starter-mainmenu-bg.png`,
    '/assets/liars-dice/starter/BG.png',
    `${loadingAsset}1.png`,
    `${loadingAsset}2.png`,
    `${loadingAsset}3.png`,
  ],

  mainmenu: [
    `${portraitAsset}starter-mainmenu-bg.png`,
    '/assets/liars-dice/main-menu/BG1.png',
    `${profileAsset}P1.png`,
    `${profileAsset}profile.png`,
    `${mainMenuAsset}6.png`,
    `${mainMenuAsset}7.png`,
    `${mainMenuAsset}8.png`,
    `${mainMenuAsset}11.png`,
    `${mainMenuAsset}22.png`,
    `${mainMenuAsset}33.png`,
    `${mainMenuAsset}44.png`,
    `${mainMenuAsset}55.png`,
    `${mainMenuAsset}66.png`,
    `${mainMenuAsset}77.png`,
    `${mainMenuAsset}88.png`,
    `${mainMenuAsset}B1.png`,
    `${mainMenuAsset}B2.png`,
    `${mainMenuAsset}B3.png`,
    `${mainMenuAsset}B4.png`,
  ],

  roomselect: [
    '/assets/liars-dice/room-select/BG.png',
    `${profileAsset}P1.png`,
    `${profileAsset}profile.png`,
    `${roomSelectAsset}6.png`,
    `${roomSelectAsset}7.png`,
    `${roomSelectAsset}8.png`,
    `${roomSelectAsset}B2.png`,
    `${roomSelectAsset}select-title.png`,
    `${roomSelectAsset}bottom-play.png`,
    `${roomSelectAsset}bottom-create.png`,
    `${roomSelectAsset}card-1.png`,
    `${roomSelectAsset}card-2.png`,
    `${roomSelectAsset}card-3.png`,
    `${roomSelectAsset}card-4.png`,
    `${roomSelectAsset}card-5.png`,
    `${roomSelectAsset}213.png`,
    `${roomSelectAsset}213124.png`,
    `${roomSelectAsset}3323423.png`,
    `${roomSelectAsset}3123213.png`,
    `${roomSelectAsset}1232131.png`,
    `${roomSelectAsset}12.png`,
    `${roomSelectAsset}13.png`,
    `${roomSelectAsset}14.png`,
    `${roomSelectAsset}15.png`,
    `${roomSelectAsset}back-button.png`,
    `${roomSelectAsset}IC1.png`,
    `${roomSelectAsset}IC2.png`,
    `${roomSelectAsset}IC3.png`,
    `${roomSelectAsset}IC4.png`,
    `${roomSelectAsset}IC5.png`,
    `${roomSelectAsset}IC6.png`,
    `${roomSelectAsset}IC7.png`,
  ],
};

export function getCriticalAssets(screenName) {
  return CRITICAL_ASSETS[screenName] || [];
}

export function getPreloadAssetsForScreen(screenName) {
  if (screenName === 'mainmenu') return [...CRITICAL_ASSETS.loading, ...CRITICAL_ASSETS.mainmenu, ...CRITICAL_ASSETS.roomselect];
  if (screenName === 'roomselect') return [...CRITICAL_ASSETS.loading, ...CRITICAL_ASSETS.roomselect];
  if (screenName === 'loading') return CRITICAL_ASSETS.loading;
  return getCriticalAssets(screenName);
}
