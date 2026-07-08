const GAMEPLAY_ASSET_ROOT = '/assets/liars-dice/gameplay';
const GAMEPLAY_MOBILE_PORTRAIT_ASSET_ROOT = '/assets/liars-dice/mobile-portrait/gameplay';

export const DEFAULT_GAMEPLAY_BACKGROUND_KEY = 'table_buyin_500';
export const PRIVATE_ROOM_BACKGROUND_KEY = 'private_room';
export const HIGH_ROLLER_BACKGROUND_KEY = 'table_buyin_5000';

export const GAMEPLAY_BACKGROUND_CONTRACTS = Object.freeze({
  table_buyin_500: Object.freeze({
    key: 'table_buyin_500',
    asset: 'BG.png',
    portraitAsset: 'mobile-BG.png',
    url: `${GAMEPLAY_ASSET_ROOT}/BG.png`,
    portraitUrl: `${GAMEPLAY_MOBILE_PORTRAIT_ASSET_ROOT}/mobile-BG.png`,
    source: 'buy_in',
    scope: 'gameplay',
    variant: 'table_buyin_500',
    label: 'Table buy-in 500',
  }),
  table_buyin_5000: Object.freeze({
    key: 'table_buyin_5000',
    asset: 'BG-2.png',
    portraitAsset: 'mobile-BG-2.png',
    url: `${GAMEPLAY_ASSET_ROOT}/BG-2.png`,
    portraitUrl: `${GAMEPLAY_MOBILE_PORTRAIT_ASSET_ROOT}/mobile-BG-2.png`,
    source: 'buy_in',
    scope: 'gameplay',
    variant: 'table_buyin_5000',
    label: 'Table buy-in 5000',
  }),
  private_room: Object.freeze({
    key: 'private_room',
    asset: 'BG-3.png',
    portraitAsset: 'mobile-BG-3.png',
    url: `${GAMEPLAY_ASSET_ROOT}/BG-3.png`,
    portraitUrl: `${GAMEPLAY_MOBILE_PORTRAIT_ASSET_ROOT}/mobile-BG-3.png`,
    source: 'private_room',
    scope: 'gameplay',
    variant: 'private_room',
    label: 'Private room',
  }),
});

const BACKGROUND_KEY_ALIASES = Object.freeze({
  bg: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  default: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  beginner: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  'table-1': DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  table1: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  'table-buyin-500': DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  table_buyin_500: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  buyin500: DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  'buy-in-500': DEFAULT_GAMEPLAY_BACKGROUND_KEY,
  highroller: HIGH_ROLLER_BACKGROUND_KEY,
  'high-roller': HIGH_ROLLER_BACKGROUND_KEY,
  high_roller: HIGH_ROLLER_BACKGROUND_KEY,
  'table-2': HIGH_ROLLER_BACKGROUND_KEY,
  table2: HIGH_ROLLER_BACKGROUND_KEY,
  'table-buyin-5000': HIGH_ROLLER_BACKGROUND_KEY,
  table_buyin_5000: HIGH_ROLLER_BACKGROUND_KEY,
  buyin5000: HIGH_ROLLER_BACKGROUND_KEY,
  'buy-in-5000': HIGH_ROLLER_BACKGROUND_KEY,
  private: PRIVATE_ROOM_BACKGROUND_KEY,
  'private-room': PRIVATE_ROOM_BACKGROUND_KEY,
  private_room: PRIVATE_ROOM_BACKGROUND_KEY,
  createroom: PRIVATE_ROOM_BACKGROUND_KEY,
  'create-room': PRIVATE_ROOM_BACKGROUND_KEY,
  custom: PRIVATE_ROOM_BACKGROUND_KEY,
});

const URL_FIELD_KEYS = [
  'gameplayBackgroundUrl',
  'backgroundUrl',
  'tableBackgroundUrl',
  'backgroundImage',
  'image',
  'url',
  'path',
  'src',
];

const ASSET_FIELD_KEYS = ['gameplayBackgroundAsset', 'backgroundAsset', 'asset', 'file', 'filename'];
const KEY_FIELD_KEYS = ['gameplayBackgroundKey', 'backgroundKey', 'backgroundVariant', 'key', 'variant'];
const PRIVATE_FIELD_KEYS = ['isPrivate', 'privateRoom', 'private', 'isCustomRoom'];
const BUY_IN_FIELD_KEYS = ['buyInAmount', 'buyInCoins', 'entryFee', 'fee', 'minBuyIn', 'customBuyIn', 'customStake'];

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '');
}

function numericAmount(value, fallback = 0) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(number) ? number : fallback;
}

function stripCssUrlWrapper(value) {
  const text = String(value || '').trim();
  const match = text.match(/^url\((.*)\)$/i);
  if (!match) return text;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function normalizeAssetName(value) {
  const text = stripCssUrlWrapper(value);
  if (!text) return '';
  return text.split(/[?#]/)[0].split('/').pop() || text;
}

function keyFromAssetOrUrl(value) {
  const asset = normalizeAssetName(value).toLowerCase();
  if (asset === 'bg-2.png' || asset === 'bg2.png') return HIGH_ROLLER_BACKGROUND_KEY;
  if (asset === 'bg-3.png' || asset === 'bg3.png') return PRIVATE_ROOM_BACKGROUND_KEY;
  if (asset === 'bg.png' || asset === 'bg-1.png' || asset === 'bg1.png') return DEFAULT_GAMEPLAY_BACKGROUND_KEY;
  return null;
}

export function normalizeGameplayBackgroundKey(value, fallback = DEFAULT_GAMEPLAY_BACKGROUND_KEY) {
  if (!hasValue(value)) return fallback;
  const raw = String(value).trim();
  const slug = normalizeSlug(raw);
  const underscoreKey = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return BACKGROUND_KEY_ALIASES[slug]
    || BACKGROUND_KEY_ALIASES[underscoreKey]
    || (GAMEPLAY_BACKGROUND_CONTRACTS[underscoreKey] ? underscoreKey : null)
    || (GAMEPLAY_BACKGROUND_CONTRACTS[raw] ? raw : null)
    || fallback;
}

export function backgroundKeyForBuyIn(value) {
  return numericAmount(value, 0) >= 5000 ? HIGH_ROLLER_BACKGROUND_KEY : DEFAULT_GAMEPLAY_BACKGROUND_KEY;
}

export function getGameplayBackgroundContract(key = DEFAULT_GAMEPLAY_BACKGROUND_KEY) {
  const normalizedKey = normalizeGameplayBackgroundKey(key, DEFAULT_GAMEPLAY_BACKGROUND_KEY);
  return GAMEPLAY_BACKGROUND_CONTRACTS[normalizedKey] || GAMEPLAY_BACKGROUND_CONTRACTS[DEFAULT_GAMEPLAY_BACKGROUND_KEY];
}

export function normalizeGameplayBackgroundUrl(value, fallbackKey = DEFAULT_GAMEPLAY_BACKGROUND_KEY) {
  const text = stripCssUrlWrapper(value);
  if (!text) return getGameplayBackgroundContract(fallbackKey).url;

  if (/^(https?:)?\/\//i.test(text) || /^(data|blob):/i.test(text)) return text;
  if (text.startsWith('/')) return text;
  if (text.startsWith('assets/')) return `/${text}`;
  if (text.includes('/assets/liars-dice/')) return text.startsWith('/') ? text : `/${text}`;
  if (text.includes('/')) return text;

  return `${GAMEPLAY_ASSET_ROOT}/${text}`;
}

function getFirstValue(source = {}, keys = []) {
  for (const key of keys) {
    if (hasValue(source?.[key])) return source[key];
  }
  return undefined;
}

function getPricingValue(source = {}, keys = []) {
  const pricing = source?.pricing && typeof source.pricing === 'object' ? source.pricing : {};
  return getFirstValue(pricing, keys) ?? getFirstValue(source, keys);
}

function sourceLooksPrivate(source = {}) {
  if (!source || typeof source !== 'object') return false;
  if (PRIVATE_FIELD_KEYS.some((key) => source[key] === true || source[key] === 1 || source[key] === '1' || String(source[key]).toLowerCase() === 'true')) return true;

  const values = [
    source.key,
    source.id,
    source.tableId,
    source.tierId,
    source.roomType,
    source.roomMode,
    source.gameMode,
    source.playMode,
    source.type,
    source.visibility,
    source.title,
    source.name,
  ].map(normalizeSlug);

  return values.some((value) => value === 'private' || value === 'private-room' || value === 'create-room' || value === 'custom');
}

function readDirectBackgroundKey(source = {}) {
  const nestedBackground = source?.background && typeof source.background === 'object' ? source.background : null;
  const directKey = getFirstValue(source, KEY_FIELD_KEYS) ?? getFirstValue(nestedBackground || {}, KEY_FIELD_KEYS);
  const directUrlKey = keyFromAssetOrUrl(getFirstValue(source, URL_FIELD_KEYS) ?? getFirstValue(nestedBackground || {}, URL_FIELD_KEYS));
  const directAssetKey = keyFromAssetOrUrl(getFirstValue(source, ASSET_FIELD_KEYS) ?? getFirstValue(nestedBackground || {}, ASSET_FIELD_KEYS));

  return normalizeGameplayBackgroundKey(directKey, null) || directUrlKey || directAssetKey;
}

function inferBackgroundKey(source = {}) {
  if (!source || typeof source !== 'object') return null;

  const directKey = readDirectBackgroundKey(source);
  if (directKey) return directKey;
  if (sourceLooksPrivate(source)) return PRIVATE_ROOM_BACKGROUND_KEY;

  const tableLikeValue = getFirstValue(source, ['tableId', 'tierId', 'tierKey', 'roomTypeId', 'selectedTableId', 'key', 'slug', 'id', 'title', 'name']);
  const tableKey = normalizeGameplayBackgroundKey(tableLikeValue, null);
  if (tableKey) return tableKey;

  const buyInAmount = getPricingValue(source, BUY_IN_FIELD_KEYS);
  if (hasValue(buyInAmount)) return backgroundKeyForBuyIn(buyInAmount);

  return null;
}

function readBackgroundUrl(source = {}, fallbackKey = DEFAULT_GAMEPLAY_BACKGROUND_KEY) {
  if (!source || typeof source !== 'object') return null;
  const nestedBackground = source.background && typeof source.background === 'object' ? source.background : null;
  const urlValue = getFirstValue(source, URL_FIELD_KEYS) ?? getFirstValue(nestedBackground || {}, URL_FIELD_KEYS);
  if (hasValue(urlValue)) return normalizeGameplayBackgroundUrl(urlValue, fallbackKey);

  const assetValue = getFirstValue(source, ASSET_FIELD_KEYS) ?? getFirstValue(nestedBackground || {}, ASSET_FIELD_KEYS);
  if (hasValue(assetValue)) return normalizeGameplayBackgroundUrl(normalizeAssetName(assetValue), fallbackKey);

  return null;
}

function flattenSources(sources = []) {
  const list = Array.isArray(sources) ? sources : [sources];
  return list.flatMap((source) => {
    if (!source) return [];
    if (Array.isArray(source)) return flattenSources(source);
    if (typeof source !== 'object') return [];
    return [source];
  });
}

function buildPayload(contract, overrides = {}) {
  const key = overrides.key || contract.key || DEFAULT_GAMEPLAY_BACKGROUND_KEY;
  const asset = overrides.asset || contract.asset || normalizeAssetName(overrides.url) || 'BG.png';
  const url = overrides.url || contract.url || normalizeGameplayBackgroundUrl(asset, key);
  const portraitAsset = overrides.portraitAsset || contract.portraitAsset || asset;
  const portraitUrl = overrides.portraitUrl || contract.portraitUrl || url;
  const source = overrides.source || contract.source || 'buy_in';
  const scope = overrides.scope || contract.scope || 'gameplay';
  const variant = overrides.variant || contract.variant || key;
  const label = overrides.label || contract.label || key;

  return {
    key,
    backgroundKey: key,
    gameplayBackgroundKey: key,
    asset,
    backgroundAsset: asset,
    gameplayBackgroundAsset: asset,
    portraitAsset,
    backgroundPortraitAsset: portraitAsset,
    gameplayPortraitBackgroundAsset: portraitAsset,
    url,
    portraitUrl,
    backgroundPortraitUrl: portraitUrl,
    gameplayPortraitBackgroundUrl: portraitUrl,
    path: url,
    image: url,
    backgroundUrl: url,
    gameplayBackgroundUrl: url,
    backgroundImage: url,
    tableBackgroundUrl: url,
    backgroundSource: source,
    backgroundScope: scope,
    backgroundVariant: variant,
    backgroundContractVersion: 1,
    background: {
      key,
      backgroundKey: key,
      gameplayBackgroundKey: key,
      asset,
      backgroundAsset: asset,
      gameplayBackgroundAsset: asset,
      portraitAsset,
      backgroundPortraitAsset: portraitAsset,
      gameplayPortraitBackgroundAsset: portraitAsset,
      url,
      portraitUrl,
      backgroundPortraitUrl: portraitUrl,
      gameplayPortraitBackgroundUrl: portraitUrl,
      path: url,
      image: url,
      backgroundUrl: url,
      gameplayBackgroundUrl: url,
      backgroundImage: url,
      source,
      scope,
      label,
      contractVersion: 1,
    },
  };
}

export function resolveGameplayBackgroundContract(sources = [], options = {}) {
  const flattenedSources = flattenSources(sources);
  const fallbackKey = normalizeGameplayBackgroundKey(options.fallbackKey, DEFAULT_GAMEPLAY_BACKGROUND_KEY);

  for (const source of flattenedSources) {
    const inferredKey = inferBackgroundKey(source);
    const url = readBackgroundUrl(source, inferredKey || fallbackKey);
    if (url || inferredKey) {
      const finalKey = normalizeGameplayBackgroundKey(inferredKey || keyFromAssetOrUrl(url), fallbackKey);
      const baseContract = getGameplayBackgroundContract(finalKey);
      return buildPayload(baseContract, {
        key: finalKey,
        asset: normalizeAssetName(url || baseContract.asset) || baseContract.asset,
        url: url || baseContract.url,
        portraitAsset: baseContract.portraitAsset,
        portraitUrl: baseContract.portraitUrl,
        source: sourceLooksPrivate(source) ? 'private_room' : baseContract.source,
      });
    }
  }

  return buildPayload(getGameplayBackgroundContract(fallbackKey));
}

export function resolveCreateRoomBackgroundContract() {
  return resolveGameplayBackgroundContract([{ key: 'private', isPrivate: true }], { fallbackKey: PRIVATE_ROOM_BACKGROUND_KEY });
}

export function resolveGameDataBackground(data = {}, options = {}) {
  const match = data?.match || {};
  const sources = [
    match,
    match.background,
    match.table,
    match.selectedTable,
    match.room,
    data?.currentRoom,
    data?.currentRoom?.background,
    data?.serverMatchmaking,
    data?.serverMatchmaking?.selectedTable,
    data?.serverMatchmaking?.table,
    data?.selectedTable,
    data?.selectedTable?.background,
    data?.playNowTable,
    data?.defaultTable,
    data?.createRoom,
  ];

  return resolveGameplayBackgroundContract(sources, options);
}

export function resolveRoomLobbyBackgroundContract(data = {}) {
  if (!data?.currentRoom) return null;
  return resolveGameplayBackgroundContract([data.currentRoom, data.selectedTable], { fallbackKey: DEFAULT_GAMEPLAY_BACKGROUND_KEY });
}

export function toCssBackgroundImageValue(url) {
  const normalizedUrl = normalizeGameplayBackgroundUrl(url, DEFAULT_GAMEPLAY_BACKGROUND_KEY);
  const escapedUrl = normalizedUrl.replace(/["\\\n\r]/g, (char) => encodeURIComponent(char));
  return `url("${escapedUrl}")`;
}

export const GAMEPLAY_BACKGROUND_PRELOAD_ASSETS = Object.freeze(
  Object.values(GAMEPLAY_BACKGROUND_CONTRACTS).flatMap((contract) => [contract.url, contract.portraitUrl].filter(Boolean)),
);
