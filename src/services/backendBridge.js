import { authApi, profileApi, roomsApi, matchmakingApi, rewardsApi, tournamentsApi, eventsApi, matchApi } from '../api/index.js';

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false';

function mockResponse(payload = {}) {
  return Promise.resolve({ ok: true, mock: true, ...payload });
}

export const backendBridge = {
  login: (credentials) => (USE_MOCK_BACKEND ? mockResponse({ credentials }) : authApi.loginUser(credentials)),
  register: (payload) => (USE_MOCK_BACKEND ? mockResponse({ userId: 'mock-user', ...payload }) : authApi.registerUser(payload)),
  loginAsGuest: () => (USE_MOCK_BACKEND ? mockResponse({ guest: true }) : authApi.loginAsGuest()),
  updateProfile: (payload) => (USE_MOCK_BACKEND ? mockResponse({ profile: payload }) : profileApi.updateProfile(payload)),
  joinRoom: (room) => {
    const roomCode = typeof room === 'string' ? room : (room?.code || room?.id || room?.key);
    return USE_MOCK_BACKEND ? mockResponse({ roomCode }) : roomsApi.joinRoom(roomCode);
  },
  createRoom: (settings) => (USE_MOCK_BACKEND ? mockResponse({ settings }) : roomsApi.createRoom(settings)),
  startMatchmaking: (payload) => (USE_MOCK_BACKEND ? mockResponse({ payload }) : matchmakingApi.startMatchmaking(payload)),
  cancelMatchmaking: () => (USE_MOCK_BACKEND ? mockResponse() : matchmakingApi.cancelMatchmaking()),
  claimDailyReward: (reward) => (USE_MOCK_BACKEND ? mockResponse({ rewardId: reward?.id }) : rewardsApi.claimDailyReward(reward?.id)),
  enterTournament: (tournament) => (USE_MOCK_BACKEND ? mockResponse({ tournamentId: tournament?.id || tournament?.key }) : tournamentsApi.enterTournament(tournament?.id || tournament?.key)),
  upgradePass: () => (USE_MOCK_BACKEND ? mockResponse({ upgraded: true }) : tournamentsApi.upgradePass()),
  playSpecialEvent: (event) => (USE_MOCK_BACKEND ? mockResponse({ eventId: event?.id || event?.key }) : eventsApi.playSpecialEvent(event?.id || event?.key)),
  submitGameAction: (action) => (USE_MOCK_BACKEND ? mockResponse({ action }) : matchApi.submitMatchAction(action)),
  getMatchResult: () => (USE_MOCK_BACKEND ? mockResponse({ result: 'win' }) : matchApi.getMatchResult()),
};
