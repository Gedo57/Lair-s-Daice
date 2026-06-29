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

function normalizeCreateRoomPayload(settings = {}) {
  const name = settings.name || settings.roomName || settings.title || 'Private Room';
  const tableId = settings.tableId || settings.selectedTableId || settings.tierId || (settings.isPrivate === false ? 'classic' : 'private');
  const maxPlayers = Number(settings.maxPlayers || settings.selectedPlayers || settings.playersCount || 4);
  const safeMaxPlayers = Number.isFinite(maxPlayers) ? Math.min(Math.max(maxPlayers, 2), 4) : 4;
  const roomMode = String(
    settings.roomMode ||
    settings.gameMode ||
    settings.playMode ||
    (settings.botsEnabled || settings.playWithBots || settings.withBots ? 'bots' : 'normal')
  ).toLowerCase() === 'bots' ? 'bots' : 'normal';

  return {
    name,
    tableId,
    maxPlayers: safeMaxPlayers,
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
    turnTimer: Number(settings.turnTimer || String(settings.selectedTimer || '').replace(/[^0-9]/g, '') || 15) || 15,
    bidStyle: 'Official Rules',
  };
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
  const endpoint = settings.isPrivate === false ? API_ENDPOINTS.rooms.create : API_ENDPOINTS.rooms.createPrivate;
  return apiRequest(endpoint, {
    method: 'POST',
    body: normalizeCreateRoomPayload(settings),
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
