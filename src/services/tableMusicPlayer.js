const DEFAULT_VOLUME = 0.35;

let audioElement = null;
let currentTrackId = null;
let currentAudioSrc = null;
let hasLoopFallbackListener = false;

function canUseAudio() {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
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
    audioElement.volume = DEFAULT_VOLUME;
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
  audio.volume = track.volume ?? DEFAULT_VOLUME;

  try {
    audio.currentTime = 0;
  } catch (_) {
    // Ignore seek errors before the audio metadata is ready.
  }

  audio.load();
  playAudio(audio);
}
