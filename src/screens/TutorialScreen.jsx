import { useCallback, useEffect, useMemo, useState } from 'react';

const TOTAL_PAGES = 10;
const LANDSCAPE_SIZE = { width: 1672, height: 941 };
const PORTRAIT_SIZE = { width: 941, height: 1672 };

// Pixel rectangles measured against the supplied tutorial artwork. They are
// converted to percentages so the transparent control stays over the button
// when the fixed game canvas is scaled by the application shell.
const HOTSPOTS = {
  landscape: [
    [1200, 730, 420, 165],
    [1345, 775, 315, 125],
    [1270, 640, 335, 120],
    [1335, 785, 305, 120],
    [1225, 710, 390, 140],
    [1245, 790, 370, 130],
    [1260, 740, 390, 135],
    [1320, 735, 345, 125],
    [1235, 745, 400, 140],
    [1195, 675, 350, 130],
  ],
  portrait: [
    [500, 1380, 400, 180],
    [600, 1480, 330, 140],
    [575, 1415, 330, 130],
    [545, 1485, 370, 145],
    [525, 1470, 400, 155],
    [550, 1450, 370, 155],
    [500, 1475, 430, 150],
    [525, 1420, 400, 155],
    [540, 1460, 390, 145],
    [405, 1490, 500, 155],
  ],
};

function toPercentRect(rect, size) {
  const [left, top, width, height] = rect;
  return {
    left: `${(left / size.width) * 100}%`,
    top: `${(top / size.height) * 100}%`,
    width: `${(width / size.width) * 100}%`,
    height: `${(height / size.height) * 100}%`,
  };
}

function tutorialImage(orientation, pageIndex) {
  return `/assets/tutorial/${orientation}/${pageIndex + 1}.png`;
}

export default function TutorialScreen({ navigation, orientation = 'landscape' }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const activeOrientation = orientation === 'portrait' ? 'portrait' : 'landscape';
  const activeSize = activeOrientation === 'portrait' ? PORTRAIT_SIZE : LANDSCAPE_SIZE;
  const imageSrc = tutorialImage(activeOrientation, pageIndex);
  const isFinalPage = pageIndex === TOTAL_PAGES - 1;

  const hotspotStyle = useMemo(
    () => toPercentRect(HOTSPOTS[activeOrientation][pageIndex], activeSize),
    [activeOrientation, activeSize, pageIndex],
  );

  const advance = useCallback(() => {
    if (isFinalPage) {
      navigation?.goMainMenu?.();
      return;
    }
    setPageIndex((current) => Math.min(TOTAL_PAGES - 1, current + 1));
  }, [isFinalPage, navigation]);

  useEffect(() => {
    setImageFailed(false);

    const paths = new Set([
      tutorialImage(activeOrientation, pageIndex),
      tutorialImage(activeOrientation === 'portrait' ? 'landscape' : 'portrait', pageIndex),
    ]);

    if (pageIndex < TOTAL_PAGES - 1) {
      paths.add(tutorialImage(activeOrientation, pageIndex + 1));
      paths.add(tutorialImage(activeOrientation === 'portrait' ? 'landscape' : 'portrait', pageIndex + 1));
    }

    paths.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [activeOrientation, pageIndex]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        advance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advance]);

  return (
    <section
      className={`screen tutorial-screen tutorial-screen--${activeOrientation}`}
      aria-label={`Tutorial page ${pageIndex + 1} of ${TOTAL_PAGES}`}
    >
      {!imageFailed ? (
        <img
          className="tutorial-screen__image"
          src={imageSrc}
          alt=""
          draggable="false"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="tutorial-screen__error" role="alert">
          Tutorial image could not be loaded:
          <code>{imageSrc}</code>
        </div>
      )}

      {!imageFailed && (
        <button
          className="tutorial-screen__hotspot"
          type="button"
          style={hotspotStyle}
          onClick={advance}
          aria-label={isFinalPage ? 'Start game' : `Next tutorial page, ${pageIndex + 2} of ${TOTAL_PAGES}`}
        />
      )}
    </section>
  );
}
