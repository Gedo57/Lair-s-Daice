import { API_ENDPOINTS } from '../config/apiConfig.js';
import { apiRequest } from './client.js';

function normalizeStartPayload(payload = {}) {
  const tableId = payload.tableId || payload.selectedTableId || payload.tierId || null;
  if (!tableId) return {};
  return { tableId };
}

export const startMatchmaking = (payload = {}) => apiRequest(API_ENDPOINTS.matchmaking.start, {
  method: 'POST',
  body: normalizeStartPayload(payload),
});

export const getMatchmakingStatus = () => apiRequest(API_ENDPOINTS.matchmaking.status);

export const getQueueStatus = (queueId) => {
  if (!queueId) throw new Error('queueId is required');
  return apiRequest(API_ENDPOINTS.matchmaking.queueStatus(queueId));
};

export const cancelMatchmaking = () => apiRequest(API_ENDPOINTS.matchmaking.cancel, { method: 'POST', body: {} });
