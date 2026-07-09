const DEFAULT_VOLUME = 0.35;
const VOLUME_STORAGE_KEY = 'liarsDice.tableMusic.volume';

let audioElement = null;
let currentTrackId = null;
let currentAudioSrc = null;
let hasLoopFallbackListener = false;
let currentVolume = readStoredVolume();

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

function writeStoredVolume(volume) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem?.(VOLUME_STORAGE_KEY, String(volume));
  } catch (_) {
    // Storage can be unavailable in private browsing or embedded webviews.
  }
}

function playAudio(audio) {
  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      // Browsers can block autoplay until the player interacts with the page.
    });
  }
}

function restartTrackFromBeginning() {
  if (!audioElement || !currentAudioSrc) return;

  try {
    audioElement.currentTime = 0;
  } catch (_) {
    // Some browsers can throw while media metadata is not ready yet.
  }

  playAudio(audioElement);
}

function getAudioElement() {
  if (!canUseAudio()) return null;

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.volume = currentVolume;
  }

  // Main loop behavior: when the track ends it starts again automatically.
  audioElement.loop = true;

  // Safety fallback for browsers/devices that fail to honor HTMLAudioElement.loop.
  if (!hasLoopFallbackListener) {
    audioElement.addEventListener('ended', restartTrackFromBeginning);
    hasLoopFallbackListener = true;
  }

  return audioElement;
}

export function stopTableMusic() {
  if (audioElement) {
    audioElement.pause();
    audioElement.removeAttribute('src');
    audioElement.load();
  }

  currentTrackId = null;
  currentAudioSrc = null;
}

export function syncTableMusic(track) {
  const nextTrackId = track?.id || null;
  const nextAudioSrc = track?.audioSrc || '';

  if (!nextTrackId || !nextAudioSrc) {
    stopTableMusic();
    return;
  }

  if (currentTrackId === nextTrackId && currentAudioSrc === nextAudioSrc) {
    return;
  }

  const audio = getAudioElement();
  if (!audio) return;

  currentTrackId = nextTrackId;
  currentAudioSrc = nextAudioSrc;

  audio.pause();
  audio.src = nextAudioSrc;
  audio.loop = true;
  audio.volume = currentVolume;

  try {
    audio.currentTime = 0;
  } catch (_) {
    // Ignore seek errors before the audio metadata is ready.
  }

  audio.load();
  playAudio(audio);
}

export function getTableMusicVolume() {
  return currentVolume;
}

export function setTableMusicVolume(volume) {
  currentVolume = clampVolume(volume);
  writeStoredVolume(currentVolume);

  if (audioElement) {
    audioElement.volume = currentVolume;
  }

  return currentVolume;
}

export function resumeTableMusic() {
  if (!audioElement || !currentAudioSrc) return;
  playAudio(audioElement);
}
