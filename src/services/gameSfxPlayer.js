const DEFAULT_SFX_VOLUME = 0.7;
const SFX_VOLUME_STORAGE_KEY = 'liarsDice.sfx.volume';

const sfxUrl = (filename) => `${import.meta.env.BASE_URL}sfx/${filename}`;

// Keep the canonical deployed name first, then tolerate legacy filenames.
// This matters on Linux/Vercel where filename case and spaces are significant.
const SFX_SOURCE_CANDIDATES = Object.freeze({
  roll: [
    sfxUrl('roll-dice.mp3'),
    sfxUrl('Roll dice.mp3'),
    sfxUrl('roll dice.mp3'),
    sfxUrl('ROLL DICE.mp3'),
  ],
  zai: [
    sfxUrl('zai.mp3'),
    sfxUrl('ZAI.mp3'),
    sfxUrl('Zai.mp3'),
  ],
  fei: [
    sfxUrl('fei.mp3'),
    sfxUrl('FEI.mp3'),
    sfxUrl('Fei.mp3'),
  ],
  callLiar: [
    sfxUrl('call-liar.mp3'),
    sfxUrl('call liar.mp3'),
    sfxUrl('Call Liar.mp3'),
    sfxUrl('CALL LIAR.mp3'),
  ],
  slam: [
    sfxUrl('slam.mp3'),
    sfxUrl('SLAM.mp3'),
    sfxUrl('Slam.mp3'),
  ],
});

const audioByEffect = new Map();
let currentSfxVolume = readStoredVolume();

function canUseAudio() {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

function clampVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_SFX_VOLUME;
  return Math.min(1, Math.max(0, number));
}

function readStoredVolume() {
  if (typeof window === 'undefined') return DEFAULT_SFX_VOLUME;

  try {
    const storedValue = window.localStorage?.getItem?.(SFX_VOLUME_STORAGE_KEY);
    if (storedValue === null || storedValue === undefined || storedValue === '') return DEFAULT_SFX_VOLUME;
    return clampVolume(storedValue);
  } catch (_) {
    return DEFAULT_SFX_VOLUME;
  }
}

function writeStoredVolume(volume) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage?.setItem?.(SFX_VOLUME_STORAGE_KEY, String(volume));
  } catch (_) {
    // Storage can be unavailable in private browsing or embedded webviews.
  }
}

function getAudioEntry(effectName) {
  if (!canUseAudio()) return null;
  const candidates = SFX_SOURCE_CANDIDATES[effectName];
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  let entry = audioByEffect.get(effectName);
  if (!entry) {
    const audio = new Audio(candidates[0]);
    audio.preload = 'auto';
    audio.volume = currentSfxVolume;
    entry = { audio, sourceIndex: 0 };
    audioByEffect.set(effectName, entry);
  }

  return entry;
}

function selectAudioSource(effectName, entry, sourceIndex) {
  const candidates = SFX_SOURCE_CANDIDATES[effectName] || [];
  if (!entry || sourceIndex < 0 || sourceIndex >= candidates.length) return false;

  if (entry.sourceIndex !== sourceIndex || entry.audio.src !== new URL(candidates[sourceIndex], window.location.href).href) {
    entry.audio.pause();
    entry.audio.src = candidates[sourceIndex];
    entry.audio.load?.();
    entry.sourceIndex = sourceIndex;
  }

  return true;
}

function tryPlayCandidate(effectName, entry, sourceIndex) {
  const candidates = SFX_SOURCE_CANDIDATES[effectName] || [];
  if (!entry || currentSfxVolume <= 0) return;
  if (sourceIndex >= candidates.length) {
    entry.sourceIndex = 0;
    return;
  }
  if (!selectAudioSource(effectName, entry, sourceIndex)) return;

  const audio = entry.audio;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = currentSfxVolume;
    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // A missing/case-mismatched file rejects play(). Try the next legacy
        // filename without dropping the animation's SFX completely.
        tryPlayCandidate(effectName, entry, sourceIndex + 1);
      });
    }
  } catch (_) {
    tryPlayCandidate(effectName, entry, sourceIndex + 1);
  }
}

export function preloadGameSfx() {
  if (!canUseAudio()) return;
  Object.keys(SFX_SOURCE_CANDIDATES).forEach((effectName) => {
    const entry = getAudioEntry(effectName);
    try {
      entry?.audio?.load?.();
    } catch (_) {
      // A failed preload should not prevent fallback playback later.
    }
  });
}

export function getGameSfxVolume() {
  return currentSfxVolume;
}

export function setGameSfxVolume(volume) {
  currentSfxVolume = clampVolume(volume);
  writeStoredVolume(currentSfxVolume);

  audioByEffect.forEach((entry) => {
    entry.audio.volume = currentSfxVolume;
  });

  return currentSfxVolume;
}

export function playGameSfx(effectName) {
  const entry = getAudioEntry(effectName);
  if (!entry || currentSfxVolume <= 0) return false;

  // Start from the last known candidate. If that candidate no longer works,
  // try the remaining names and finally wrap once through earlier candidates.
  const startIndex = Math.max(0, Math.min(entry.sourceIndex, (SFX_SOURCE_CANDIDATES[effectName]?.length || 1) - 1));
  tryPlayCandidate(effectName, entry, startIndex);
  return true;
}
