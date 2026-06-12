import { mockAchievements, mockPlayerProfile, mockProfileStats } from './mockProfile.js';
import { mockFeaturedRooms, mockRoomList } from './mockRooms.js';
import { mockMatchFound, mockMatchmakingSession } from './mockMatchmaking.js';
import { mockGameResult, mockGameState } from './mockGameState.js';

const delay = (ms = 220) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const createId = (prefix) => `${prefix}_${Date.now()}`;

export const mockApi = {
  async registerUser(payload = {}) {
    await delay();
    return {
      message: 'User registered successfully',
      userId: createId('user'),
      user: {
        ...mockPlayerProfile,
        id: createId('user'),
        username: payload.username || mockPlayerProfile.username,
        email: payload.email || 'player1@example.com',
      },
    };
  },

  async login(credentials = {}) {
    await delay();
    return {
      message: 'Login successful',
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      user: {
        ...mockPlayerProfile,
        username: credentials.username || mockPlayerProfile.username,
        name: credentials.username || mockPlayerProfile.name,
        email: credentials.email || 'Stevie22@gmail.com',
      },
    };
  },

  async refreshToken() {
    await delay();
    return {
      accessToken: 'mock_refreshed_access_token',
      refreshToken: 'mock_refresh_token_2',
    };
  },

  async continueAsGuest() {
    await delay();
    return {
      accessToken: 'mock_guest_access_token',
      refreshToken: 'mock_guest_refresh_token',
      user: {
        ...mockPlayerProfile,
        id: 'guest_player',
        name: 'Guest',
      },
    };
  },

  async getProfile() {
    await delay();
    return {
      success: true,
      profile: mockPlayerProfile,
    };
  },

  async updateProfile(payload = {}) {
    await delay();
    return {
      success: true,
      message: 'Profile updated',
      profile: {
        ...mockPlayerProfile,
        ...payload,
      },
    };
  },

  async getPublicProfile(userId) {
    await delay();
    return {
      success: true,
      profile: {
        ...mockPlayerProfile,
        id: userId,
        trophies: 500,
      },
    };
  },

  async getProfileStats() {
    await delay();
    return mockProfileStats;
  },

  async getAchievements() {
    await delay();
    return mockAchievements;
  },

  async getFeaturedRooms() {
    await delay();
    return mockFeaturedRooms;
  },

  async getRooms() {
    await delay();
    return mockRoomList;
  },

  async createRoom(payload) {
    await delay();
    return {
      id: createId('room'),
      status: 'created',
      ...payload,
    };
  },

  async joinRoom(roomId) {
    await delay();
    return {
      id: roomId,
      status: 'joined',
    };
  },

  async startMatchmaking(payload = {}) {
    await delay(260);
    return {
      ...mockMatchmakingSession,
      roomId: payload.roomId || 'quick_match',
      maxPlayers: payload.maxPlayers || 3,
    };
  },

  async getMatchmakingStatus(sessionId) {
    await delay(300);
    return {
      ...mockMatchFound,
      id: sessionId || mockMatchFound.id,
    };
  },

  async cancelMatchmaking(sessionId) {
    await delay();
    return {
      id: sessionId,
      status: 'cancelled',
    };
  },

  async getGameState(matchId = mockGameState.matchId) {
    await delay();
    return {
      ...mockGameState,
      matchId,
    };
  },

  async sendGameAction(matchId, action) {
    await delay(120);
    return {
      matchId,
      accepted: true,
      action,
      serverTime: new Date().toISOString(),
    };
  },

  async leaveGame(matchId) {
    await delay();
    return {
      matchId,
      status: 'left',
    };
  },

  async finishGame(matchId, payload = {}) {
    await delay();
    return {
      ...mockGameResult,
      matchId,
      ...payload,
    };
  },
};
