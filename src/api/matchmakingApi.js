import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

export const startMatchmaking = (payload) => apiRequest(API_ENDPOINTS.matchmaking.start, {
  method: 'POST',
  body: payload,
});

export const cancelMatchmaking = () => apiRequest(API_ENDPOINTS.matchmaking.cancel, { method: 'POST' });
export const getMatchmakingStatus = () => apiRequest(API_ENDPOINTS.matchmaking.status);
