import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

function withQuery(endpoint, query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return `${endpoint}${queryString ? `?${queryString}` : ''}`;
}

function getRoomIdentifier(room) {
  if (typeof room === 'string') return room;
  return room?.roomId || room?.id || room?.roomCode || room?.code || room?.key || room?.tierId || room?.tableId || null;
}

function looksLikeRoomCode(value) {
  const text = String(value || '').trim();
  return /^LD[-A-Z0-9]*\d/i.test(text) || /^[A-Z0-9]{4,10}$/.test(text);
}

function numericSetting(settings = {}, keys = [], fallback = undefined) {
  for (const key of keys) {
    const value = settings[key];
    if (value === undefined || value === null || value === '') continue;
    const numeric = Number(String(value).replace(/,/g, '').trim());
    if (Number.isFinite(numeric)) return Math.max(0, Math.trunc(numeric));
  }
  return fallback;
}

function cleanCoinBetOptions(options = [], min = 0, max = Infinity) {
  if (!Array.isArray(options)) return [];
  return Array.from(new Set(options
    .map((value) => Number(String(value).replace(/,/g, '').trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.trunc(value))))
    .filter((value) => value >= min && value <= max)
    .sort((left, right) => left - right);
}


function normalizePekPercentage(value, fallback = 100) {
  const number = Number(String(value || '').replace(/[^0-9]/g, '').trim());
  return [25, 50, 100].includes(number) ? number : fallback;
}

function booleanSetting(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 1 || value === '1') return true;
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'on', 'yes', 'enabled'].includes(normalized)) return true;
  if (['false', 'off', 'no', 'disabled', '0'].includes(normalized)) return false;
  return fallback;
}

function normalizeCreateRoomPayload(settings = {}) {
  const name = settings.name || settings.roomName || settings.title || 'Private Room';
  const isPrivate = settings.isPrivate !== false && String(settings.isPrivate).toLowerCase() !== 'false';
  // Create Room is a custom-room flow. The private toggle controls visibility only;
  // the custom players/timer/buy-in rules should stay custom whether the room is public or private.
  const tableId = settings.tableId || settings.selectedTableId || settings.tierId || 'private';
  const maxPlayers = Number(settings.maxPlayers || settings.selectedPlayers || settings.playersCount || 4);
  const safeMaxPlayers = Number.isFinite(maxPlayers) ? Math.min(Math.max(maxPlayers, 2), 4) : 4;
  const roomMode = String(
    settings.roomMode ||
    settings.gameMode ||
    settings.playMode ||
    (settings.botsEnabled || settings.playWithBots || settings.withBots ? 'bots' : 'normal')
  ).toLowerCase() === 'bots' ? 'bots' : 'normal';
  const buyInAmount = numericSetting(settings, ['buyInAmount', 'buyInCoins', 'customBuyIn', 'customStake', 'stakeAmount', 'stake', 'entryFee']);
  const perGameAmount = numericSetting(settings, ['perGameAmount', 'perGameCoins', 'roundStake', 'roundStakeAmount', 'baseStake', 'baseBet', 'gameAmount', 'gameStake', 'defaultCoinBet', 'defaultBidCoins']);
  const fixedPerGameAmount = perGameAmount !== undefined ? perGameAmount : numericSetting(settings, ['minCoinBet', 'minBidCoins', 'minBet', 'minimumBet']);
  const minCoinBet = fixedPerGameAmount;
  const maxCoinBet = fixedPerGameAmount;
  const defaultCoinBet = fixedPerGameAmount;
  const bidCoinStep = numericSetting(settings, ['bidCoinStep', 'coinBidStep']);
  const coinBetOptions = fixedPerGameAmount !== undefined ? [fixedPerGameAmount] : cleanCoinBetOptions(settings.coinBetOptions, minCoinBet || 0, maxCoinBet || Infinity);
  const pekEnabled = booleanSetting(settings.pekEnabled ?? settings.slamEnabled ?? settings.pekMode ?? settings.slamMode, false);
  const pekPercentage = normalizePekPercentage(settings.pekPercentage ?? settings.slamPercentage ?? settings.pekPercent ?? settings.slamPercent, 100);
  const finalPekAmount = fixedPerGameAmount !== undefined ? fixedPerGameAmount + Math.floor((fixedPerGameAmount * pekPercentage) / 100) : undefined;

  const payload = {
    name,
    tableId,
    isPrivate,
    visibility: isPrivate ? 'private' : 'public',
    maxPlayers: safeMaxPlayers,
    selectedPlayers: safeMaxPlayers,
    requiredPlayers: safeMaxPlayers,
    playersCount: safeMaxPlayers,
    roomMode,
    gameMode: roomMode,
    playMode: roomMode,
    botsEnabled: roomMode === 'bots',
    playWithBots: roomMode === 'bots',
    withBots: roomMode === 'bots',
    startingCups: 5,
    startingDice: 5,
    dicePerPlayer: 5,
    dicePerRound: 5,
    turnTimer: Number(settings.turnTimer || String(settings.selectedTimer || '').replace(/[^0-9]/g, '') || 30) || 30,
    bidStyle: 'Official Rules',
  };

  if (buyInAmount !== undefined) {
    payload.buyInAmount = buyInAmount;
    payload.buyInCoins = buyInAmount;
    payload.customBuyIn = buyInAmount;
    payload.customStake = buyInAmount;
    payload.entryFee = buyInAmount;
  }
  if (fixedPerGameAmount !== undefined) {
    payload.perGameAmount = fixedPerGameAmount;
    payload.perGameCoins = fixedPerGameAmount;
    payload.roundStake = fixedPerGameAmount;
    payload.minCoinBet = fixedPerGameAmount;
    payload.minBidCoins = fixedPerGameAmount;
    payload.maxCoinBet = fixedPerGameAmount;
    payload.maxBidCoins = fixedPerGameAmount;
    payload.defaultCoinBet = fixedPerGameAmount;
    payload.defaultBidCoins = fixedPerGameAmount;
    payload.coinBetOptions = [fixedPerGameAmount];
  } else {
    if (minCoinBet !== undefined) {
      payload.minCoinBet = minCoinBet;
      payload.minBidCoins = minCoinBet;
    }
    if (maxCoinBet !== undefined) {
      payload.maxCoinBet = maxCoinBet;
      payload.maxBidCoins = maxCoinBet;
    }
    if (defaultCoinBet !== undefined) {
      payload.defaultCoinBet = defaultCoinBet;
      payload.defaultBidCoins = defaultCoinBet;
    }
    if (coinBetOptions.length) payload.coinBetOptions = coinBetOptions;
  }
  payload.pekEnabled = pekEnabled;
  payload.slamEnabled = pekEnabled;
  payload.pekPercentage = pekPercentage;
  payload.slamPercentage = pekPercentage;
  if (finalPekAmount !== undefined) {
    payload.finalPekAmount = finalPekAmount;
    payload.finalSlamAmount = finalPekAmount;
  }
  if (bidCoinStep !== undefined) payload.bidCoinStep = bidCoinStep;

  return payload;
}

function normalizeJoinPayload(room = {}) {
  if (typeof room === 'string') {
    return looksLikeRoomCode(room) ? { roomCode: room } : { roomId: room };
  }

  if (room?.roomCode || room?.code) return { roomCode: room.roomCode || room.code };
  if (room?.roomId || room?.id) return { roomId: room.roomId || room.id };
  if (room?.tableId || room?.tierId || room?.key) return { tableId: room.tableId || room.tierId || room.key };

  throw new Error('roomCode, roomId, or tableId is required');
}

export const getRooms = () => apiRequest(API_ENDPOINTS.rooms.list);
export const getRoomTiers = ({ includePrivate = true } = {}) => apiRequest(
  withQuery(API_ENDPOINTS.rooms.tiers, { includePrivate }),
);
export const getActiveRooms = ({ limit } = {}) => apiRequest(withQuery(API_ENDPOINTS.rooms.active, { limit }));
export const getMyRoom = () => apiRequest(API_ENDPOINTS.rooms.my);

export const getRoom = (room) => {
  const roomId = getRoomIdentifier(room);
  if (!roomId) throw new Error('roomId is required');
  return apiRequest(API_ENDPOINTS.rooms.details(roomId));
};

export const createRoom = (settings = {}) => {
  const payload = normalizeCreateRoomPayload(settings);
  const endpoint = payload.isPrivate === false ? API_ENDPOINTS.rooms.create : API_ENDPOINTS.rooms.createPrivate;
  return apiRequest(endpoint, {
    method: 'POST',
    body: payload,
  });
};

export const joinRoom = (room) => apiRequest(API_ENDPOINTS.rooms.join, {
  method: 'POST',
  body: normalizeJoinPayload(room),
});

export const joinRoomById = (room) => {
  const roomId = getRoomIdentifier(room);
  if (!roomId) throw new Error('roomId is required');
  return apiRequest(API_ENDPOINTS.rooms.joinById(roomId), {
    method: 'POST',
    body: {},
  });
};

export const leaveRoom = (room) => {
  const roomId = getRoomIdentifier(room);
  if (!roomId) throw new Error('roomId is required');
  return apiRequest(API_ENDPOINTS.rooms.leave(roomId), {
    method: 'POST',
    body: {},
  });
};


export const setRoomReady = (room, ready = true) => {
  const roomId = getRoomIdentifier(room);
  if (!roomId) throw new Error('roomId is required');
  return apiRequest(API_ENDPOINTS.rooms.ready(roomId), {
    method: 'POST',
    body: { ready: Boolean(ready) },
  });
};

export const startRoom = (room, payload = {}) => {
  const roomId = getRoomIdentifier(room);
  if (!roomId) throw new Error('roomId is required');
  return apiRequest(API_ENDPOINTS.rooms.start(roomId), {
    method: 'POST',
    body: payload && Object.keys(payload).length ? payload : {},
  });
};
