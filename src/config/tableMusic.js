const MUSIC_BASE_PATH = '/assets/liars-dice/music';

export const TABLE_MUSIC_TRACKS = {
  beginner: {
    id: 'beginner',
    label: 'Beginner Table Music',
    placeholder: `${MUSIC_BASE_PATH}/beginner-table-music.txt`,
    audioSrc: '/assets/liars-dice/music/beginner-table-music.mp3',
  },
  'high-roller': {
    id: 'high-roller',
    label: 'High Roller Table Music',
    placeholder: `${MUSIC_BASE_PATH}/high-roller-table-music.txt`,
    audioSrc: '/assets/liars-dice/music/high-roller-table-music.mp3',
  },
  createroom: {
    id: 'createroom',
    label: 'Create Room Music',
    placeholder: `${MUSIC_BASE_PATH}/create-room-music.txt`,
    audioSrc: '/assets/liars-dice/music/create-room-music.mp3',
  },
};

const TABLE_KEY_ALIASES = {
  beginner: 'beginner',
  beginners: 'beginner',
  basic: 'beginner',
  casual: 'beginner',
  table_buyin_500: 'beginner',
  'table-buyin-500': 'beginner',
  highroller: 'high-roller',
  'high-roller': 'high-roller',
  high_roller: 'high-roller',
  'high-rollers': 'high-roller',
  vip: 'high-roller',
  table_buyin_5000: 'high-roller',
  'table-buyin-5000': 'high-roller',
  private: 'createroom',
  'private-room': 'createroom',
  private_room: 'createroom',
  createroom: 'createroom',
  'create-room': 'createroom',
  create_room: 'createroom',
};

const MUSIC_ENABLED_SCREENS = new Set([
  'gameplay',
  'mockgame',
]);

function slugifyMusicKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTableMusicKey(value) {
  const rawValue = String(value || '').trim().toLowerCase();
  const slug = slugifyMusicKey(value);
  return TABLE_KEY_ALIASES[rawValue]
    || TABLE_KEY_ALIASES[slug]
    || TABLE_KEY_ALIASES[slug.replace(/-/g, '_')]
    || null;
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function resolveSelectedTableSource(gameData = {}) {
  return firstValue(
    gameData.match?.selectedTable,
    gameData.match?.table,
    gameData.match?.tier,
    gameData.currentRoom?.selectedTable,
    gameData.currentRoom?.table,
    gameData.currentRoom?.tier,
    gameData.currentRoom,
    gameData.selectedTable,
    gameData.currentTable,
    gameData.table,
    gameData.tier,
    gameData.matchmaking?.selectedTable,
    gameData.matchmaking?.table,
    gameData.defaultTable,
    gameData.playNowTable,
  );
}

function resolveMusicKeyFromTable(table) {
  if (!table) return null;

  if (typeof table === 'string') {
    return normalizeTableMusicKey(table);
  }

  const explicitMusicKey = normalizeTableMusicKey(firstValue(
    table.musicKey,
    table.key,
    table.slug,
    table.tierKey,
    table.tierId,
    table.tableId,
    table.roomTypeId,
    table.id,
    table.name,
    table.title,
    table.type,
    table.roomType,
  ));

  if (explicitMusicKey) return explicitMusicKey;

  const looksLikePrivateRoom = Boolean(
    table.isPrivate
    || table.private
    || table.roomCode
    || table.code
    || table.roomName
  );

  return looksLikePrivateRoom ? 'createroom' : null;
}

function isActiveGameplayMusicScreen(screenName, gameData = {}) {
  if (screenName === 'mockgame') return true;
  if (!MUSIC_ENABLED_SCREENS.has(screenName)) return false;

  const match = gameData.match || {};
  const status = String(match.status || match.matchStatus || gameData.status || '').toLowerCase();

  return Boolean(
    gameData.currentMatchId
    || match.id
    || match.matchId
    || ['active', 'in_progress', 'started', 'game_started'].includes(status)
  );
}

export function resolveTableMusicTrack(screenName, gameData = {}) {
  if (!isActiveGameplayMusicScreen(screenName, gameData)) return null;

  const musicKey = resolveMusicKeyFromTable(resolveSelectedTableSource(gameData));
  if (!musicKey) return null;

  return TABLE_MUSIC_TRACKS[musicKey] || null;
}
