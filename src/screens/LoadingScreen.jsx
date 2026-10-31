import { useEffect, useRef, useState } from 'react';

const loadingAsset = '/assets/liars-dice/loading/';
const sparkles = Array.from({ length: 16 }, (_, index) => index + 1);

export default function LoadingScreen({ navigation, data, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const assetLoading = data?.assetLoading || {};
  const controlledProgress = Number(assetLoading.progress || 0);
  const isPreloadingAssets = Boolean(assetLoading.active);
  const destinationLabel = assetLoading.destinationLabel || 'assets';
  const [localProgress, setLocalProgress] = useState(1);
  // App recreates its navigation object during wallet and asset updates.
  // Keep the newest callback without restarting the progress animation.
  const goMainMenuRef = useRef(navigation?.goMainMenu);
  goMainMenuRef.current = navigation?.goMainMenu;

  useEffect(() => {
    if (isPreloadingAssets) return undefined;
    setLocalProgress(1);
    const id = window.setInterval(() => {
      setLocalProgress((value) => {
        const increment = value < 18 ? 1 : value < 45 ? 2 : value < 75 ? 3 : 4;
        return Math.min(100, value + increment);
      });
    }, 95);
    return () => window.clearInterval(id);
  }, [isPreloadingAssets]);

  useEffect(() => {
    if (isPreloadingAssets || localProgress < 100) return undefined;
    const id = window.setTimeout(() => goMainMenuRef.current?.(), 450);
    return () => window.clearTimeout(id);
  }, [isPreloadingAssets, localProgress]);

  const progress = isPreloadingAssets
    ? Math.max(1, Math.min(100, controlledProgress || 1))
    : localProgress;
  const loadingCopy = isPreloadingAssets
    ? `Loading ${destinationLabel}`
    : 'LOADING';

  return (
    <section className="screen loading-screen" aria-label={tx('Loading Screen')}>
      <div className="loading-vfx loading-vfx--vignette" aria-hidden="true" />
      <div className="loading-vfx loading-vfx--logoShine" aria-hidden="true" />
      <div className="loading-vfx loading-vfx--cupsSpark" aria-hidden="true" />
      <div className="loading-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`loading-sparkle loading-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <div className="loading-panel">
        <img className="loading-panel__skin" src={`${loadingAsset}1.png`} alt="" draggable="false" />
        <div className="loading-title">
          <span className="loading-title__word">{tx(loadingCopy)}</span>
          <span className="loading-title__dots" aria-hidden="true" />
          <span className="loading-title__percent">{progress}%</span>
        </div>
        <div className="loading-bar">
          <img className="loading-bar__empty" src={`${loadingAsset}2.png`} alt="" draggable="false" />
          <div className="loading-bar__fill-mask" style={{ width: `${progress}%` }}>
            <img className="loading-bar__fill" src={`${loadingAsset}3.png`} alt="" draggable="false" />
            <span className="loading-bar__shine" aria-hidden="true" />
            <span className="loading-bar__tip" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
