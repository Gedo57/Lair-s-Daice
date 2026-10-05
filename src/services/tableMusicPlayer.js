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
let gestureUnlockCleanup = null;

// Safari/iOS does not reliably apply HTMLMediaElement.volume changes while
// media is playing. Once the user touches the music volume control, route the
// table music through a Web Audio GainNode and control loudness there instead.
let audioContext = null;
let mediaElementSource = null;
let musicGainNode = null;
let usingWebAudioGain = false;

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

function getAudioContextConstructor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function resumeAudioContext() {
  if (!audioContext || audioContext.state !== 'suspended') return;

  try {
    const resumePromise = audioContext.resume();
    if (resumePromise?.catch) resumePromise.catch(() => {});
  } catch (_) {
    // Keep the HTMLAudioElement path available if Web Audio cannot resume.
  }
}

function ensureWebAudioVolumeControl({ resume = false } = {}) {
  if (!audioElement) return false;
  if (usingWebAudioGain && musicGainNode) {
    if (resume) resumeAudioContext();
    return true;
  }

  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) return false;

  try {
    if (!audioContext) audioContext = new AudioContextConstructor();
    if (!mediaElementSource) {
      mediaElementSource = audioContext.createMediaElementSource(audioElement);
    }
    if (!musicGainNode) {
      musicGainNode = audioContext.createGain();
      mediaElementSource.connect(musicGainNode);
      musicGainNode.connect(audioContext.destination);
    }

    usingWebAudioGain = true;

    // Web Audio owns loudness from this point onward. Keep the media element at
    // unity gain so Safari cannot fight the slider by ignoring element.volume.
    audioElement.volume = 1;
    audioElement.muted = false;
    musicGainNode.gain.value = getEffectiveVolume();

    if (resume) resumeAudioContext();
    return true;
  } catch (_) {
    usingWebAudioGain = false;
    musicGainNode = null;
    return false;
  }
}

function applyAudioVolume() {
  if (!audioElement) return;

  if (usingWebAudioGain && musicGainNode) {
    audioElement.volume = 1;
    audioElement.muted = false;
    musicGainNode.gain.value = getEffectiveVolume();
    return;
  }

  audioElement.volume = getEffectiveVolume();
  audioElement.muted = currentMuted;
}

function playAudio(audio) {
  if (usingWebAudioGain) resumeAudioContext();

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
    applyAudioVolume();
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

    // Recover playback if the browser/OS paused the element while keeping the
    // same track loaded. This does not seek when playback is already healthy.
    if (audio.paused && !currentMuted) playAudio(audio);
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
  applyAudioVolume();

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

  // This is called directly by the range input, so it runs during a user
  // gesture and is the safest point to initialize/resume Web Audio on iOS.
  // Create the reusable media element here too if playback has not started yet,
  // so the first slider interaction still unlocks the GainNode path.
  if (!audioElement) getAudioElement();
  ensureWebAudioVolumeControl({ resume: true });
  applyAudioVolume();

  // Volume and mute are intentionally independent controls. Moving the slider
  // must not silently change the user's explicit mute preference.
  return currentVolume;
}

export function getTableMusicMuted() {
  return currentMuted;
}

export function setTableMusicMuted(muted) {
  currentMuted = Boolean(muted);
  writeStoredMuted(currentMuted);

  // The mute control is also a user gesture. Reuse the same gain path so mute
  // and slider state cannot diverge on Safari/iOS.
  if (!audioElement) getAudioElement();
  ensureWebAudioVolumeControl({ resume: true });
  applyAudioVolume();

  return currentMuted;
}

export function toggleTableMusicMuted() {
  return setTableMusicMuted(!currentMuted);
}

export function resumeTableMusic({ forceSync = true } = {}) {
  if (!audioElement || !currentAudioSrc) return false;

  if (usingWebAudioGain) resumeAudioContext();

  // UI controls can call this safely: an already-playing track is never
  // restarted or force-seeked just because a menu was opened/closed.
  if (!audioElement.paused && !audioElement.ended) return true;

  if (forceSync) {
    // If autoplay was blocked, resume on the current shared timeline rather
    // than from a stale buffered position.
    seekToSynchronizedPosition(audioElement, { force: true });
  }

  playAudio(audioElement);
  return true;
}

export function installTableMusicGestureUnlock() {
  if (typeof window === 'undefined') return () => {};
  if (gestureUnlockCleanup) return gestureUnlockCleanup;

  const tryResumeFromGesture = () => {
    if (usingWebAudioGain) resumeAudioContext();

    // Autoplay-restricted browsers (notably Safari/iOS) may reject the first
    // automatic play(). Any normal player interaction should unlock the music;
    // the SOUND/settings button is deliberately not special-cased.
    if (!audioElement || !currentAudioSrc || currentMuted) return;
    if (audioElement.paused || audioElement.ended) {
      resumeTableMusic({ forceSync: true });
    }
  };

  const pointerOptions = { capture: true, passive: true };
  window.addEventListener('pointerdown', tryResumeFromGesture, pointerOptions);
  window.addEventListener('touchend', tryResumeFromGesture, pointerOptions);
  window.addEventListener('keydown', tryResumeFromGesture, true);

  const cleanup = () => {
    window.removeEventListener('pointerdown', tryResumeFromGesture, true);
    window.removeEventListener('touchend', tryResumeFromGesture, true);
    window.removeEventListener('keydown', tryResumeFromGesture, true);
    if (gestureUnlockCleanup === cleanup) gestureUnlockCleanup = null;
  };

  gestureUnlockCleanup = cleanup;
  return cleanup;
}
