const cache = new Map();
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_BACKGROUND_CONCURRENCY = 2;

function normalizeSrc(src) {
  if (!src || typeof src !== 'string') return '';
  return src.trim();
}

function makeProgress(loaded, total, src = '', ok = true) {
  return {
    loaded,
    total,
    percent: total ? Math.max(1, Math.min(100, Math.round((loaded / total) * 100))) : 100,
    src,
    ok,
  };
}

function scheduleIdleTask(callback, options = {}) {
  const delayMs = Math.max(0, Number(options.delayMs) || 0);
  const timeout = Math.max(0, Number(options.idleTimeoutMs) || 2000);
  let idleId = null;
  let timerId = null;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => {
        if (!cancelled) callback();
      }, { timeout });
      return;
    }

    timerId = window.setTimeout(() => {
      if (!cancelled) callback();
    }, 0);
  };

  timerId = window.setTimeout(run, delayMs);

  return () => {
    cancelled = true;
    if (timerId) window.clearTimeout(timerId);
    if (idleId && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId);
    }
  };
}

function compactResult(result = {}) {
  return {
    src: result.src || '',
    ok: Boolean(result.ok),
    ...(result.skipped ? { skipped: true } : {}),
    ...(result.reason ? { reason: result.reason } : {}),
  };
}

function preloadWithImage(src, timeoutMs, options = {}) {
  if (typeof Image === 'undefined') {
    return Promise.resolve({ src, ok: false, skipped: true, reason: 'image-api-unavailable' });
  }

  return new Promise((resolve) => {
    const image = new Image();
    let finished = false;
    let timeoutId = null;

    const finish = (ok, reason = ok ? 'loaded' : 'failed') => {
      if (finished) return;
      finished = true;
      if (timeoutId) window.clearTimeout(timeoutId);

      // Do not keep a decoded HTMLImageElement in our JS cache. Safari/iOS can
      // otherwise retain the decoded bitmap for every preloaded asset, causing
      // memory pressure and eventually a WebContent-process reload.
      image.onload = null;
      image.onerror = null;
      resolve({ src, ok, reason });
    };

    image.onload = () => finish(true);
    image.onerror = () => finish(false, 'error');
    image.decoding = 'async';

    // Background preloads should never compete aggressively with the current
    // screen. Browsers that support fetchPriority will schedule these lower.
    if ('fetchPriority' in image && options.priority === 'low') {
      image.fetchPriority = 'low';
    }

    timeoutId = window.setTimeout(() => finish(false, 'timeout'), timeoutMs);
    image.src = src;

    if (image.complete && image.naturalWidth > 0) finish(true, 'cached');
  });
}

export function clearAssetPreloadCache() {
  cache.clear();
}

export function getPreloadedAssetState(src) {
  const safeSrc = normalizeSrc(src);
  return safeSrc ? cache.get(safeSrc) || null : null;
}

export function isAssetPreloaded(src) {
  return getPreloadedAssetState(src)?.ok === true;
}

export function getAssetPreloadSnapshot() {
  return Array.from(cache.values()).map(({ promise, ...state }) => state);
}

export function preloadAsset(src, options = {}) {
  const safeSrc = normalizeSrc(src);
  if (!safeSrc) return Promise.resolve({ src: safeSrc, ok: false, skipped: true, reason: 'empty-src' });

  const cached = cache.get(safeSrc);
  if (cached?.promise) return cached.promise;
  if (cached && typeof cached.ok === 'boolean') return Promise.resolve(compactResult(cached));

  const timeoutMs = Number.isFinite(Number(options.timeoutMs)) ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const promise = preloadWithImage(safeSrc, timeoutMs, options).then((result) => {
    const settled = { ...compactResult(result), loadedAt: Date.now() };

    // Only compact metadata is retained. In particular, never retain the Image
    // object or a resolved Promise that closes over it.
    cache.set(safeSrc, settled);
    return compactResult(settled);
  });

  cache.set(safeSrc, { src: safeSrc, ok: null, pending: true, promise });
  return promise;
}

async function runPool(items, worker, concurrency) {
  const safeConcurrency = Math.max(1, Math.min(Number(concurrency) || DEFAULT_CONCURRENCY, items.length || 1));
  let cursor = 0;

  const workers = Array.from({ length: safeConcurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(workers);
}

export async function preloadAssets(list = [], options = {}) {
  const assets = [...new Set((Array.isArray(list) ? list : []).map(normalizeSrc).filter(Boolean))];
  const total = assets.length;
  const onProgress = typeof options === 'function' ? options : options.onProgress;
  const timeoutMs = typeof options === 'function' ? DEFAULT_TIMEOUT_MS : options.timeoutMs;
  const concurrency = typeof options === 'function' ? DEFAULT_CONCURRENCY : options.concurrency;
  const priority = typeof options === 'function' ? 'auto' : options.priority;

  if (!total) {
    onProgress?.(makeProgress(0, 0));
    return [];
  }

  let loaded = 0;
  const results = new Array(total);
  onProgress?.({ loaded: 0, total, percent: 0, src: '', ok: true });

  await runPool(assets, async (src, index) => {
    const result = await preloadAsset(src, { timeoutMs, priority });
    results[index] = result;
    loaded += 1;
    onProgress?.(makeProgress(loaded, total, src, result.ok));
  }, concurrency);

  return results;
}

export function preloadAssetsInBackground(list = [], options = {}) {
  const assets = [...new Set((Array.isArray(list) ? list : []).map(normalizeSrc).filter(Boolean))];
  let cancelled = false;
  let stopIdleTask = null;

  const promise = new Promise((resolve) => {
    stopIdleTask = scheduleIdleTask(async () => {
      if (cancelled || !assets.length) {
        resolve([]);
        return;
      }

      const results = new Array(assets.length);
      let loaded = 0;
      const concurrency = Math.max(1, Number(options.concurrency) || DEFAULT_BACKGROUND_CONCURRENCY);

      try {
        await runPool(assets, async (src, index) => {
          // Cancellation cannot abort an image request already in flight, but it
          // prevents all remaining background assets from being started.
          if (cancelled) return;

          const result = await preloadAsset(src, {
            timeoutMs: options.timeoutMs ?? 10000,
            priority: 'low',
          });
          results[index] = result;
          loaded += 1;
          options.onProgress?.(makeProgress(loaded, assets.length, src, result.ok));
        }, concurrency);
      } catch (_) {
        // Background preload is always best-effort.
      }

      resolve(results.filter(Boolean));
    }, {
      delayMs: options.delayMs ?? 700,
      idleTimeoutMs: options.idleTimeoutMs ?? 2000,
    });
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      stopIdleTask?.();
    },
  };
}

export const preloadImage = preloadAsset;
export const preloadImages = (list = [], onProgress) => preloadAssets(list, { onProgress });
