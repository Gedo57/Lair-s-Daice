export function normalizePlayer(player = {}, index = 0) {
  const fallbackPositions = ['top', 'left', 'right', 'bottom'];

  return {
    id: player.id || player.userId || player.playerId || `player_${index + 1}`,
    name: player.name || player.username || player.displayName || `Player ${index + 1}`,
    avatar: player.avatar || player.avatarUrl || player.icon || 'Stevie.png',
    coins: player.coins ?? player.balance ?? player.score ?? '0',
    position: player.position || fallbackPositions[index] || 'left',
    ready: Boolean(player.ready ?? player.isReady),
  };
}

export function normalizeGameState(response = {}) {
  const state = response.game || response.gameState || response.state || response;
  const players = Array.isArray(state.players)
    ? state.players.map(normalizePlayer)
    : [];

  return {
    ...state,
    matchId: state.matchId || state.id || response.matchId,
    room: state.room || response.room || { id: state.roomId, name: state.roomName },
    players,
    activeTurnPosition: state.activeTurnPosition || state.currentTurnPosition || state.turnPosition,
    currentTurnPlayerId: state.currentTurnPlayerId || state.turnPlayerId,
    round: state.round || state.windRound || 'East 1',
    timer: state.timer ?? state.remainingSeconds ?? 18,
  };
}

export function normalizeMatchmakingSession(response = {}) {
  const session = response.session || response.matchmaking || response;
  const match = response.match || session.match || null;
  const matchId = session.matchId || response.matchId || match?.id || match?.matchId || null;

  return {
    ...session,
    id: session.id || session.sessionId || response.sessionId,
    sessionId: session.sessionId || session.id || response.sessionId,
    status: session.status || response.status || (matchId ? 'found' : 'searching'),
    matchId,
    roomId: session.roomId || response.roomId || match?.roomId,
    players: Array.isArray(session.players)
      ? session.players.map(normalizePlayer)
      : [],
  };
}

export function normalizeRoom(room = {}) {
  return {
    ...room,
    id: room.id || room.roomId || room.slug || room.title,
    title: room.title || room.name || room.roomName || 'SAKURA ROOM',
    name: room.name || room.title || room.roomName || 'Sakura Room',
    level: room.level || room.tier || room.difficulty || 'Beginner',
    players: room.players ?? room.onlinePlayers ?? room.playerCount ?? '0',
    fee: room.fee ?? room.bet ?? room.entryFee ?? '500',
    prize: room.prize ?? room.prizePool ?? '2,000',
    bg: room.bg || room.background || 'room-card-green.png',
    character: room.character || room.avatar || 'panda.png',
    button: room.button || 'button-green.png',
  };
}

export function normalizeRoomList(response = []) {
  const list = response.rooms || response.featuredRooms || response.data || response;
  return Array.isArray(list) ? list.map(normalizeRoom) : [];
}
