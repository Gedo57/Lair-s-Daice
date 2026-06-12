export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    guest: '/api/auth/guest',
    logout: '/api/auth/logout',
  },
  profile: {
    me: '/api/auth/profile',
    update: '/api/auth/profile',
    public: (userId) => `/api/auth/profile/${userId}`,
    wallet: '/api/profile/wallet',
  },
  rooms: {
    list: '/api/rooms',
    create: '/api/rooms',
    join: (roomId) => `/api/rooms/${roomId}/join`,
  },
  matchmaking: {
    start: '/api/matchmaking/start',
    cancel: '/api/matchmaking/cancel',
    status: '/api/matchmaking/status',
  },
  rewards: {
    daily: '/api/rewards/daily',
    claimDaily: (rewardId) => `/api/rewards/daily/${rewardId}/claim`,
  },
  tournaments: {
    list: '/api/tournaments',
    enter: (tournamentId) => `/api/tournaments/${tournamentId}/enter`,
    pass: '/api/tournaments/pass',
    upgradePass: '/api/tournaments/pass/upgrade',
  },
  events: {
    list: '/api/events',
    play: (eventId) => `/api/events/${eventId}/play`,
    missions: '/api/events/missions',
  },
  match: {
    state: '/api/match/state',
    action: '/api/match/action',
    result: '/api/match/result',
  },
};
