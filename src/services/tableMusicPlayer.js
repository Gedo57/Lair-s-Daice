const DEFAULT_VOLUME = 0.35;
const VOLUME_STORAGE_KEY = 'liarsDice.tableMusic.volume';

// Patch 3 — Global table-music synchronization
// The backend provides one shared timeline anchor plus the authoritative server
// clock. Every client derives its playback position from that same timeline.
const FALLBACK_TIMELINE_ANCHOR_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const DEFAULT_DRIFT_TOLERANCE_MS = 900;
const INTERNAL_DRIFT_CHECK_MS = 5000;

let audioElement = null;
let currentTrackId = null;
let currentAudioSrc = null;
let hasLoopFallbackListener = false;
let pendingMetadataHandler = null;
let playbackRequestId = 0;
let currentVolume = readStoredVolume();
let currentMuted = readStoredMuted();
let timelineAnchorMs = FALLBACK_TIMELINE_ANCHOR_MS;
let serverClockOffsetMs = 0;
let driftToleranceMs = DEFAULT_DRIFT_TOLERANCE_MS;
let driftTimer = null;

function canUseAudio() {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, number));
}

function readStoredVolume() {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;

  try {
    const storedValue = window.localStorage?.getItem?.(VOLUME_STORAGE_KEY);
    if (storedValue === null || storedValue === undefined || storedValue === '') return DEFAULT_VOLUME;
    return clampVolume(storedValue);
  } catch (_) {
    return DEFAULT_VOLUME;
  }
}

function readStoredMuted() {
  if (typeof window === 'undefined') return false;

  try {
    const storedValue = window.localStorage?.getItem?.('liarsDice.tableMusic.muted');
    return storedValue === '1' || storedValue === 'true';
  } catch (_) {
    return false;
  }
}

function writeStoredVolume(volume) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem?.(VOLUME_STORAGE_KEY, String(volume));
  } catch (_) {
    // Storage can be unavailable in private browsing or embedded webviews.
  }
}

function writeStoredMuted(muted) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem?.('liarsDice.tableMusic.muted', muted ? '1' : '0');
  } catch (_) {
    // Storage can be unavailable in private browsing or embedded webviews.
  }
}

function getEffectiveVolume() {
  return currentMuted ? 0 : currentVolume;
}

function applyAudioVolume() {
  if (audioElement) {
    audioElement.volume = getEffectiveVolume();
    audioElement.muted = currentMuted;
  }
}

function playAudio(audio) {
  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      // Browsers can block autoplay until the player interacts with the page.
      // resumeTableMusic() re-applies the synchronized position on interaction.
    });
  }
}

function removePendingMetadataHandler() {
  if (!audioElement || !pendingMetadataHandler) return;
  audioElement.removeEventListener('loadedmetadata', pendingMetadataHandler);
  pendingMetadataHandler = null;
}

function clearDriftTimer() {
  if (driftTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(driftTimer);
  }
  driftTimer = null;
}

function estimatedServerNowMs() {
  return Date.now() + serverClockOffsetMs;
}

function targetPlaybackSeconds(duration, atServerTimeMs = estimatedServerNowMs()) {
  const safeDuration = Number(duration);
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) return 0;

  const elapsedSeconds = Math.max(0, (Number(atServerTimeMs) - timelineAnchorMs) / 1000);
  return ((elapsedSeconds % safeDuration) + safeDuration) % safeDuration;
}

function circularDistanceSeconds(left, right, duration) {
  const safeDuration = Number(duration);
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) return Math.abs(left - right);

  const direct = Math.abs(left - right);
  return Math.min(direct, Math.abs(safeDuration - direct));
}

function seekToSynchronizedPosition(audio, { force = false } = {}) {
  if (!audio || audio !== audioElement || !currentAudioSrc) return false;

  const duration = Number(audio.duration);
  if (!Number.isFinite(duration) || duration <= 0) return false;

  const target = targetPlaybackSeconds(duration);
  const current = Number(audio.currentTime) || 0;
  const driftSeconds = circularDistanceSeconds(current, target, duration);
  const toleranceSeconds = Math.max(0, driftToleranceMs) / 1000;

  if (!force && driftSeconds <= toleranceSeconds) return false;

  try {
    audio.currentTime = Math.min(Math.max(0, target), Math.max(0, duration - 0.05));
    return true;
  } catch (_) {
    return false;
  }
}

function startDriftTimer() {
  clearDriftTimer();
  if (typeof window === 'undefined') return;

  driftTimer = window.setInterval(() => {
    if (!audioElement || !currentAudioSrc) return;
    seekToSynchronizedPosition(audioElement);
  }, INTERNAL_DRIFT_CHECK_MS);
}

function applySyncPayload(sync = {}) {
  const serverTimeMs = Number(sync?.serverTimeMs);
  const anchorMs = Number(sync?.timelineAnchorMs);
  const requestStartedAtMs = Number(sync?.clientRequestStartedAtMs);
  const receivedAtMs = Number(sync?.clientReceivedAtMs);
  const tolerance = Number(sync?.driftToleranceMs);

  if (Number.isFinite(anchorMs) && anchorMs > 0) {
    timelineAnchorMs = anchorMs;
  }

  if (Number.isFinite(tolerance) && tolerance >= 0) {
    driftToleranceMs = tolerance;
  }

  if (Number.isFinite(serverTimeMs)) {
    // Estimate the server/client clock offset using the midpoint of the request.
    // This removes most of the round-trip latency from the synchronization math.
    const midpoint = Number.isFinite(requestStartedAtMs) && Number.isFinite(receivedAtMs)
      ? (requestStartedAtMs + receivedAtMs) / 2
      : (Number.isFinite(receivedAtMs) ? receivedAtMs : Date.now());
    serverClockOffsetMs = serverTimeMs - midpoint;
  }
}

function restartTrackOnSharedTimeline() {
  if (!audioElement || !currentAudioSrc) return;
  seekToSynchronizedPosition(audioElement, { force: true });
  playAudio(audioElement);
}

function getAudioElement() {
  if (!canUseAudio()) return null;

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.volume = getEffectiveVolume();
    audioElement.muted = currentMuted;
  }

  audioElement.loop = true;

  // Safety fallback for browsers/devices that fail to honor HTMLAudioElement.loop.
  // Restarting uses the shared timeline, not local time 0.
  if (!hasLoopFallbackListener) {
    audioElement.addEventListener('ended', restartTrackOnSharedTimeline);
    hasLoopFallbackListener = true;
  }

  return audioElement;
}

export function stopTableMusic() {
  playbackRequestId += 1;
  removePendingMetadataHandler();
  clearDriftTimer();

  if (audioElement) {
    audioElement.pause();
    audioElement.removeAttribute('src');
    audioElement.load();
  }

  currentTrackId = null;
  currentAudioSrc = null;
}

export function syncTableMusic(track, sync = {}) {
  const nextTrackId = track?.id || null;
  const nextAudioSrc = track?.audioSrc || '';

  if (!nextTrackId || !nextAudioSrc) {
    stopTableMusic();
    return;
  }

  applySyncPayload(sync);

  const audio = getAudioElement();
  if (!audio) return;

  // A periodic backend refresh can update the server clock without reloading the MP3.
  if (currentTrackId === nextTrackId && currentAudioSrc === nextAudioSrc) {
    seekToSynchronizedPosition(audio);
    startDriftTimer();
    return;
  }

  playbackRequestId += 1;
  const requestId = playbackRequestId;

  removePendingMetadataHandler();
  currentTrackId = nextTrackId;
  currentAudioSrc = nextAudioSrc;

  audio.pause();
  audio.src = nextAudioSrc;
  audio.loop = true;
  audio.volume = getEffectiveVolume();
  audio.muted = currentMuted;

  const seekAndPlay = () => {
    if (
      requestId !== playbackRequestId
      || audio !== audioElement
      || currentTrackId !== nextTrackId
      || currentAudioSrc !== nextAudioSrc
    ) {
      return;
    }

    seekToSynchronizedPosition(audio, { force: true });
    startDriftTimer();
    playAudio(audio);
  };

  pendingMetadataHandler = () => {
    pendingMetadataHandler = null;
    seekAndPlay();
  };

  audio.addEventListener('loadedmetadata', pendingMetadataHandler, { once: true });
  audio.load();

  // Cached media can already have metadata immediately after assigning src.
  if (audio.readyState >= 1) {
    removePendingMetadataHandler();
    seekAndPlay();
  }
}

export function getTableMusicVolume() {
  return currentVolume;
}

export function setTableMusicVolume(volume) {
  currentVolume = clampVolume(volume);
  writeStoredVolume(currentVolume);

  if (currentVolume > 0 && currentMuted) {
    currentMuted = false;
    writeStoredMuted(currentMuted);
  }

  applyAudioVolume();

  return currentVolume;
}

export function getTableMusicMuted() {
  return currentMuted;
}

export function setTableMusicMuted(muted) {
  currentMuted = Boolean(muted);
  writeStoredMuted(currentMuted);
  applyAudioVolume();

  return currentMuted;
}

export function toggleTableMusicMuted() {
  return setTableMusicMuted(!currentMuted);
}

export function resumeTableMusic() {
  if (!audioElement || !currentAudioSrc) return;
  // If autoplay was blocked, do not resume from the stale buffered position.
  seekToSynchronizedPosition(audioElement, { force: true });
  playAudio(audioElement);
}
