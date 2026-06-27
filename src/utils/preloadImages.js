const imageCache = new Map();

function normalizeSrc(src) {
  if (!src || typeof src !== 'string') return '';
  return src.trim();
}

export function preloadImage(src) {
  const safeSrc = normalizeSrc(src);
  if (!safeSrc) return Promise.resolve({ src: safeSrc, ok: false, skipped: true });

  if (imageCache.has(safeSrc)) return imageCache.get(safeSrc);

  const promise = new Promise((resolve) => {
    const image = new Image();

    const finish = async (ok) => {
      try {
        if (ok && image.decode) {
          await image.decode();
        }
      } catch {
        // Some Safari/iOS versions reject decode for cached images.
        // The image is still usable after onload, so continue.
      }

      resolve({ src: safeSrc, ok });
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = safeSrc;

    if (image.complete && image.naturalWidth > 0) {
      finish(true);
    }
  });

  imageCache.set(safeSrc, promise);
  return promise;
}

export async function preloadImages(list = [], onProgress) {
  const images = [...new Set((Array.isArray(list) ? list : []).map(normalizeSrc).filter(Boolean))];
  const total = images.length;

  if (!total) {
    onProgress?.({ loaded: 0, total: 0, percent: 100 });
    return [];
  }

  let loaded = 0;
  onProgress?.({ loaded, total, percent: 0 });

  const results = await Promise.all(images.map(async (src) => {
    const result = await preloadImage(src);
    loaded += 1;
    onProgress?.({
      loaded,
      total,
      percent: Math.max(1, Math.min(100, Math.round((loaded / total) * 100))),
      src,
      ok: result.ok,
    });
    return result;
  }));

  return results;
}
